export async function chatText(_text: string, _mode: string): Promise<{ reply: string }> {
  return { reply: '' };
}

export async function uploadAudio(_audioBlob: Blob, _mode: string): Promise<{ reply: string }> {
  return { reply: '' };
}

export async function sendOffer(_sdp: string, _type: string): Promise<{ sdp: string; type: string }> {
  return { sdp: '', type: 'answer' };
}