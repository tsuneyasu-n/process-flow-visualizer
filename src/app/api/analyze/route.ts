import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ProcessNode, ProcessEdge, AnalysisResult } from '@/types/flow';

interface AnalyzeRequest {
  nodes: ProcessNode[];
  edges: ProcessEdge[];
  flowName: string;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI APIキーが設定されていません。環境変数OPENAI_API_KEYを設定してください。' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });

    const { nodes, edges, flowName }: AnalyzeRequest = await request.json();

    if (!nodes || nodes.length === 0) {
      return NextResponse.json(
        { error: 'ノードがありません' },
        { status: 400 }
      );
    }

    // フローデータをテキストに変換
    const flowDescription = generateFlowDescription(nodes, edges, flowName);

    const prompt = `あなたは業務プロセス改善の専門家です。以下の業務フローを分析し、ボトルネックと改善提案を提供してください。

## 業務フロー情報
${flowDescription}

## 分析タスク
1. フロー全体のサマリーを1-2文で記述
2. ボトルネック（遅延の原因となるステップ）を特定
3. 改善提案を具体的に列挙

## 出力形式
以下のJSON形式で回答してください：
{
  "summary": "フロー全体のサマリー（1-2文）",
  "totalDuration": 総所要時間（分、数値のみ）,
  "bottlenecks": [
    {
      "nodeId": "ボトルネックのノードID",
      "nodeName": "ノード名",
      "reason": "ボトルネックの理由",
      "suggestion": "改善案"
    }
  ],
  "improvements": [
    {
      "category": "自動化" | "統合" | "削除" | "並列化" | "その他",
      "description": "改善の具体的な説明",
      "impact": "high" | "medium" | "low"
    }
  ]
}

注意：
- bottlenecksは所要時間が長いステップ、待機時間が長いステップを優先
- improvementsは実現可能性と効果のバランスを考慮
- 必ず有効なJSONのみを出力してください（説明文なし）`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'あなたは業務プロセス改善の専門家です。JSONのみを出力してください。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('AI応答が空です');
    }

    const analysisResult: AnalysisResult = JSON.parse(responseText);

    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: '分析中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

function generateFlowDescription(
  nodes: ProcessNode[],
  edges: ProcessEdge[],
  flowName: string
): string {
  let description = `フロー名: ${flowName}\n\n`;

  // ノード一覧
  description += '### ステップ一覧\n';
  nodes.forEach((node, index) => {
    const data = node.data;
    description += `${index + 1}. [${data.nodeType}] ${data.label}`;
    description += ` (ID: ${node.id})`;
    if (data.assignee) description += ` - 担当: ${data.assignee}`;
    if (data.duration) description += ` - 所要時間: ${data.duration}分`;
    if (data.description) description += `\n   説明: ${data.description}`;
    if (data.issues && data.issues.length > 0) {
      description += `\n   課題: ${data.issues.join(', ')}`;
    }
    description += '\n';
  });

  // 接続関係
  description += '\n### フローの流れ\n';
  edges.forEach((edge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);
    if (sourceNode && targetNode) {
      description += `- ${sourceNode.data.label} → ${targetNode.data.label}`;
      if (edge.data?.label) description += ` (${edge.data.label})`;
      description += '\n';
    }
  });

  // 総所要時間を計算
  const totalDuration = nodes.reduce(
    (sum, node) => sum + ((node.data.duration as number) || 0),
    0
  );
  description += `\n### 統計\n`;
  description += `- 総ステップ数: ${nodes.length}\n`;
  description += `- 総所要時間: ${totalDuration}分\n`;

  return description;
}
