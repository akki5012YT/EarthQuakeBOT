/**
 * Chatwork API クライアント
 * 公式エンドポイント https://api.chatwork.com/v2 への通信を担当
 */

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  rateLimitRemaining?: number;
}

export interface ChatworkUserResult {
  success: boolean;
  user?: {
    accountId: number;
    name: string;
    chatworkId: string;
    organizationName: string;
    avatarUrl: string;
  };
  error?: string;
}

export async function sendChatworkMessage(
  apiToken: string,
  roomId: string | number,
  body: string
): Promise<SendMessageResult> {
  if (!apiToken || !apiToken.trim()) {
    return { success: false, error: 'Chatwork APIトークンが設定されていません。' };
  }
  if (!roomId || !String(roomId).trim()) {
    return { success: false, error: 'Chatwork ルームIDが設定されていません。' };
  }

  const endpoint = `https://api.chatwork.com/v2/rooms/${encodeURIComponent(String(roomId).trim())}/messages`;

  try {
    const params = new URLSearchParams();
    params.append('body', body);
    params.append('self_unread', '0');

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'X-ChatWorkToken': apiToken.trim(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const rateLimitRemaining = res.headers.get('x-ratelimit-remaining')
      ? parseInt(res.headers.get('x-ratelimit-remaining')!, 10)
      : undefined;

    if (!res.ok) {
      let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
      try {
        const errJson = await res.json();
        if (errJson.errors && Array.isArray(errJson.errors)) {
          errorMessage = errJson.errors.join(', ');
        }
      } catch {
        // use default message
      }

      if (res.status === 401) {
        errorMessage = 'Chatwork APIトークンが無効または失効しています。再度確認してください。';
      } else if (res.status === 403) {
        errorMessage = 'このルームに対する送信権限がありません、またはアカウントが参加していません。';
      } else if (res.status === 404) {
        errorMessage = `指定されたルームID (${roomId}) が見つかりませんでした。`;
      } else if (res.status === 429) {
        errorMessage = 'Chatwork APIのレート制限（5分間に300回）に達しました。しばらく待って再試行してください。';
      }

      return {
        success: false,
        error: errorMessage,
        rateLimitRemaining,
      };
    }

    const data = (await res.json()) as { message_id: string };
    return {
      success: true,
      messageId: data.message_id,
      rateLimitRemaining,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `通信エラー: ${errorMsg}`,
    };
  }
}

export async function verifyChatworkToken(apiToken: string): Promise<ChatworkUserResult> {
  if (!apiToken || !apiToken.trim()) {
    return { success: false, error: 'APIトークンを入力してください。' };
  }

  try {
    const res = await fetch('https://api.chatwork.com/v2/me', {
      headers: {
        'X-ChatWorkToken': apiToken.trim(),
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        return { success: false, error: 'APIトークンが正しくありません (401 Unauthorized)。' };
      }
      return { success: false, error: `認証エラー (HTTP ${res.status}): ${res.statusText}` };
    }

    const data = (await res.json()) as {
      account_id: number;
      name: string;
      chatwork_id: string;
      organization_name: string;
      avatar_image_url: string;
    };

    return {
      success: true,
      user: {
        accountId: data.account_id,
        name: data.name,
        chatworkId: data.chatwork_id,
        organizationName: data.organization_name,
        avatarUrl: data.avatar_image_url,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: `ネットワークエラー: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export async function fetchChatworkRooms(apiToken: string) {
  if (!apiToken || !apiToken.trim()) {
    return { success: false, rooms: [], error: 'APIトークンがありません' };
  }

  try {
    const res = await fetch('https://api.chatwork.com/v2/rooms', {
      headers: {
        'X-ChatWorkToken': apiToken.trim(),
      },
    });

    if (!res.ok) {
      return { success: false, rooms: [], error: `ルーム一覧取得失敗: HTTP ${res.status}` };
    }

    const rooms = (await res.json()) as Array<{
      room_id: number;
      name: string;
      type: string;
      role: string;
      sticky: boolean;
      unread_num: number;
      mention_num: number;
      icon_path?: string;
    }>;

    return {
      success: true,
      rooms,
    };
  } catch (err: unknown) {
    return {
      success: false,
      rooms: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
