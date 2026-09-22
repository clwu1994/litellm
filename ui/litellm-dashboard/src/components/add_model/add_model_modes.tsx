export const TEST_MODES = [
  { value: "chat", labelKey: "addModel.testModes.chat" },
  { value: "completion", labelKey: "addModel.testModes.completion" },
  { value: "embedding", labelKey: "addModel.testModes.embedding" },
  { value: "audio_speech", labelKey: "addModel.testModes.audioSpeech" },
  { value: "audio_transcription", labelKey: "addModel.testModes.audioTranscription" },
  { value: "image_generation", labelKey: "addModel.testModes.imageGeneration" },
  { value: "image_edit", labelKey: "addModel.testModes.imageEdit" },
  { value: "video_generation", labelKey: "addModel.testModes.videoGeneration" },
  { value: "rerank", labelKey: "addModel.testModes.rerank" },
  { value: "realtime", labelKey: "addModel.testModes.realtime" },
  { value: "batch", labelKey: "addModel.testModes.batch" },
  { value: "ocr", labelKey: "addModel.testModes.ocr" },
] as const;
