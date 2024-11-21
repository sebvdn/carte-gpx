import { useReactMediaRecorder } from 'react-media-recorder';
import { Mic, Square, Save } from 'lucide-react';

interface MediaRecorderProps {
  onSave: (media: { type: 'audio' | 'video'; url: string }) => void;
}

export function MediaRecorder({ onSave }: MediaRecorderProps) {
  const { status, startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder({
    video: false,
    audio: true,
  });

  return (
    <div className="flex items-center gap-2">
      {status !== 'recording' ? (
        <button
          onClick={startRecording}
          className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Mic className="w-4 h-4" />
          <span className="text-sm">Audio</span>
        </button>
      ) : (
        <button
          onClick={stopRecording}
          className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          <Square className="w-4 h-4" />
          <span className="text-sm">Stop</span>
        </button>
      )}
      {mediaBlobUrl && (
        <button
          onClick={() => onSave({ type: 'audio', url: mediaBlobUrl })}
          className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
        >
          <Save className="w-4 h-4" />
          <span className="text-sm">Save</span>
        </button>
      )}
    </div>
  );
}