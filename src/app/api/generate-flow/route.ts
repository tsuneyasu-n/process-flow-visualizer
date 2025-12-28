'use server';

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured' },
      { status: 500 }
    );
  }

  const openai = new OpenAI({ apiKey });

  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `あなたはBPMNフロー図を生成するアシスタントです。
ユーザーが提供するマニュアルや手順書のテキストを解析し、BPMNフロー図用のノードとエッジのJSONデータを生成してください。

利用可能なノードタイプ:
- start: 開始イベント（フローの開始点）
- end: 終了イベント（フローの終了点）
- intermediate: 中間イベント（待機など）
- task: 一般タスク
- userTask: ユーザータスク（人間が行う作業）
- serviceTask: サービスタスク（システムが行う作業）
- scriptTask: スクリプトタスク（自動処理）
- exclusiveGateway: 排他ゲートウェイ（分岐・条件判断）
- parallelGateway: 並列ゲートウェイ（並行処理）
- inclusiveGateway: 包含ゲートウェイ（複数条件）
- wait: 待機
- subprocess: サブプロセス

レスポンス形式:
{
  "flowName": "フロー名",
  "nodes": [
    {
      "id": "node-1",
      "type": "processNode",
      "position": { "x": 400, "y": 50 },
      "data": {
        "label": "ラベル",
        "nodeType": "start",
        "assignee": "担当者（任意）",
        "duration": 所要時間（分、任意）,
        "description": "説明（任意）"
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2",
      "label": "ラベル（任意）"
    }
  ]
}

ルール:
1. 必ずstartノードで開始し、endノードで終了する
2. ノードは縦方向に配置（y座標を100-120ずつ増加）
3. ゲートウェイ後の分岐はx座標を調整して並列配置
4. 「承認」「確認」「判断」→ exclusiveGateway
5. 「並行して」「同時に」→ parallelGateway
6. 「待つ」「待機」→ wait
7. 人の作業 → userTask、システム処理 → serviceTask
8. 所要時間は妥当な値を推定（分単位）
9. 担当者や部署名があれば assignee に設定`
        },
        {
          role: 'user',
          content: `以下のマニュアル/手順書をBPMNフロー図に変換してください:\n\n${text}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    const result = JSON.parse(content);

    // バリデーション
    if (!result.nodes || !Array.isArray(result.nodes)) {
      throw new Error('Invalid nodes format');
    }
    if (!result.edges || !Array.isArray(result.edges)) {
      throw new Error('Invalid edges format');
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Generate flow error:', error);
    return NextResponse.json(
      { error: 'Failed to generate flow' },
      { status: 500 }
    );
  }
}
