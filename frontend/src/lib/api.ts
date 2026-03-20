const rawBase = import.meta.env.VITE_API_BASE_URL?.toString().trim().replace(/\/$/, '') || '';
const API_BASE_URL = rawBase === '' ? '' : rawBase;

const withBase = (path: string) => `${API_BASE_URL}${path}`;

/** Thrown for failed API responses; includes HTTP status for branching (e.g. 404). */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const toError = async (response: Response): Promise<ApiError> => {
  const text = await response.text();
  if (!text) return new ApiError(`Request failed with status ${response.status}`, response.status);
  try {
    const j = JSON.parse(text);
    const detail = j?.detail;
    if (Array.isArray(detail)) {
      const msg = detail
        .map((item) => {
          const loc = Array.isArray(item?.loc) ? item.loc.filter((p: unknown) => p !== 'body') : [];
          const path = loc.length > 0 ? loc.join('.') : '';
          const message = typeof item?.msg === 'string' ? item.msg : 'Invalid value';
          return path ? `${path}: ${message}` : message;
        })
        .join('; ');
      return new ApiError(msg || `Request failed with status ${response.status}`, response.status);
    }
    if (typeof detail === 'string' && detail.trim() !== '') {
      return new ApiError(detail, response.status);
    }
    return new ApiError(text || `Request failed with status ${response.status}`, response.status);
  } catch {
    return new ApiError(text || `Request failed with status ${response.status}`, response.status);
  }
};

function headers(token?: string): HeadersInit {
  const h: HeadersInit = {};
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

export type UploadResult = { message?: string };
export type QueryResult = { answer: string; sources?: Array<Record<string, unknown>> };
export type AuthResult = { access_token: string; refresh_token?: string; token_type: string };
export type ChatSessionResult = { id: string; title: string; updated_at: string };
export type ChatMessageResult = { id: string; role: 'user' | 'assistant'; message: string; timestamp: string };

async function authRequest(
  endpoint: '/auth/login' | '/auth/signup',
  email: string,
  password: string,
): Promise<AuthResult> {
  const normalizedEmail = email.trim();
  const response = await fetch(withBase(endpoint), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: normalizedEmail, password }),
  });
  if (!response.ok) throw await toError(response);
  return response.json() as Promise<AuthResult>;
}

export async function login(email: string, password: string): Promise<AuthResult> {
  return authRequest('/auth/login', email, password);
}

export async function signup(email: string, password: string): Promise<AuthResult> {
  return authRequest('/auth/signup', email, password);
}

export async function uploadDocument(file: File, token?: string, signal?: AbortSignal): Promise<UploadResult> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const isDocx =
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.name.toLowerCase().endsWith('.docx');

  if (!isPdf && !isDocx) {
    throw new Error('Only PDF or DOCX files are supported.');
  }

  const endpoint = isPdf ? '/upload/pdf' : '/upload/docx';
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(withBase(endpoint), {
    method: 'POST',
    headers: headers(token),
    body: formData,
    signal,
  });

  if (!response.ok) {
    throw await toError(response);
  }

  try {
    return (await response.json()) as UploadResult;
  } catch (error) {
    return {};
  }
}

export async function askQuestion(
  question: string,
  topK = 4,
  token?: string,
  chatId?: string,
): Promise<QueryResult & { chat_id?: string }> {
  if (!token) {
    const response = await fetch(withBase('/chat/general'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    if (!response.ok) {
      if (response.status >= 500) {
        return {
          answer:
            'The general chat service is temporarily unavailable. Please try again shortly, or sign in and use document chat if available.',
        };
      }
      throw await toError(response);
    }
    return (await response.json()) as QueryResult;
  }

  const formData = new FormData();
  formData.append('question', question);
  formData.append('top_k', String(topK));
  if (chatId) {
    formData.append('chat_id', chatId);
  }

  const response = await fetch(withBase('/query'), {
    method: 'POST',
    headers: headers(token),
    body: formData,
  });

  if (!response.ok) {
    throw await toError(response);
  }

  return (await response.json()) as QueryResult;
}

export async function listChatSessions(token: string): Promise<ChatSessionResult[]> {
  const response = await fetch(withBase('/chat/sessions'), {
    method: 'GET',
    headers: headers(token),
  });
  if (!response.ok) throw await toError(response);
  return (await response.json()) as ChatSessionResult[];
}

export async function createChatSession(token: string, title = 'New Chat'): Promise<ChatSessionResult> {
  const response = await fetch(withBase('/chat/sessions'), {
    method: 'POST',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!response.ok) throw await toError(response);
  return (await response.json()) as ChatSessionResult;
}

export async function getChatMessages(token: string, sessionId: string): Promise<ChatMessageResult[]> {
  const response = await fetch(withBase(`/chat/sessions/${sessionId}/messages`), {
    method: 'GET',
    headers: headers(token),
  });
  if (!response.ok) throw await toError(response);
  return (await response.json()) as ChatMessageResult[];
}

export async function renameChatSession(
  token: string,
  sessionId: string,
  title: string,
): Promise<ChatSessionResult> {
  const response = await fetch(withBase(`/chat/sessions/${sessionId}`), {
    method: 'PATCH',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!response.ok) throw await toError(response);
  return (await response.json()) as ChatSessionResult;
}

export async function deleteChatSession(token: string, sessionId: string): Promise<void> {
  const response = await fetch(withBase(`/chat/sessions/${sessionId}`), {
    method: 'DELETE',
    headers: headers(token),
  });
  if (!response.ok) throw await toError(response);
}
