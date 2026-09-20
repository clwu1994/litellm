import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import type { MessageType } from "@/components/chat_ui/types";
import AudioRenderer from "./AudioRenderer";
import ChatImageRenderer from "./ChatImageRenderer";
import ChatImageUpload from "./ChatImageUpload";
import FilePreviewCard from "./FilePreviewCard";
import ResponsesImageRenderer from "./ResponsesImageRenderer";
import ResponsesImageUpload from "./ResponsesImageUpload";

const makeFile = (name: string, type = "image/png", size = 1024) => new File([new Uint8Array(size)], name, { type });

describe("chat attachments Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese file preview chrome", () => {
    render(<FilePreviewCard file={makeFile("photo.png")} previewUrl="blob:http://localhost/a" onRemove={vi.fn()} />);

    expect(screen.getByAltText("上传预览")).toBeInTheDocument();
    expect(screen.queryByAltText("Upload preview")).not.toBeInTheDocument();
    expect(screen.getByText("图片")).toBeInTheDocument();
    expect(screen.queryByText("Image")).not.toBeInTheDocument();
    expect(screen.getByLabelText("移除 photo.png")).toBeInTheDocument();
    expect(screen.queryByLabelText("Remove photo.png")).not.toBeInTheDocument();
  });

  it("renders the Chinese PDF label", () => {
    render(<FilePreviewCard file={makeFile("doc.pdf")} previewUrl={null} onRemove={vi.fn()} />);

    expect(screen.getByText("PDF")).toBeInTheDocument();
    expect(screen.getByLabelText("移除 doc.pdf")).toBeInTheDocument();
  });

  it("renders the Chinese audio fallback text", () => {
    render(<AudioRenderer message={{ role: "assistant", content: "blob:audio", isAudio: true }} />);

    expect(screen.getByText("你的浏览器不支持音频元素。")).toBeInTheDocument();
    expect(screen.queryByText("Your browser does not support the audio element.")).not.toBeInTheDocument();
  });

  it("renders the Chinese attached image and PDF chrome", () => {
    const imageMessage: MessageType = {
      role: "user",
      content: "hello [Image attached]",
      imagePreviewUrl: "blob:http://localhost/a",
    };
    const { unmount } = render(<ChatImageRenderer message={imageMessage} />);
    expect(screen.getByAltText("用户上传的图片")).toBeInTheDocument();
    expect(screen.queryByAltText("User uploaded image")).not.toBeInTheDocument();
    unmount();

    render(<ChatImageRenderer message={{ ...imageMessage, content: "hello [PDF attached]" }} />);
    expect(screen.getByLabelText("PDF 附件")).toBeInTheDocument();
    expect(screen.queryByLabelText("PDF attachment")).not.toBeInTheDocument();
  });

  it("renders the Chinese responses image chrome", () => {
    const imageMessage: MessageType = {
      role: "user",
      content: "hello [Image attached]",
      imagePreviewUrl: "blob:http://localhost/a",
    };
    const { unmount } = render(<ResponsesImageRenderer message={imageMessage} />);
    expect(screen.getByAltText("用户上传的图片")).toBeInTheDocument();
    unmount();

    render(<ResponsesImageRenderer message={{ ...imageMessage, content: "hello [PDF attached]" }} />);
    expect(screen.getByLabelText("PDF 附件")).toBeInTheDocument();
  });

  it("renders the Chinese attach affordance and its tooltip while it is open", async () => {
    const user = userEvent.setup({ delay: null });
    const { unmount } = render(
      <ChatImageUpload
        chatUploadedImage={null}
        chatImagePreviewUrl={null}
        onImageUpload={vi.fn()}
        onRemoveImage={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("附加图片或 PDF")).toBeInTheDocument();
    expect(screen.queryByLabelText("Attach image or PDF")).not.toBeInTheDocument();
    await user.hover(screen.getByLabelText("附加图片或 PDF"));
    expect(await screen.findByText("附加图片或 PDF")).toBeInTheDocument();
    expect(screen.queryByText("Attach image or PDF")).not.toBeInTheDocument();
    unmount();

    render(
      <ResponsesImageUpload
        responsesUploadedImage={null}
        responsesImagePreviewUrl={null}
        onImageUpload={vi.fn()}
        onRemoveImage={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("附加图片或 PDF")).toBeInTheDocument();
  });

  it("reports the Chinese upload validation toasts", () => {
    const { container } = render(
      <ChatImageUpload
        chatUploadedImage={null}
        chatImagePreviewUrl={null}
        onImageUpload={vi.fn()}
        onRemoveImage={vi.fn()}
      />,
    );
    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the sr-only file input carries no accessible name
    const input = container.querySelector("input[type=file]") as HTMLInputElement;

    fireEvent.change(input, { target: { files: [makeFile("notes.txt", "text/plain")] } });
    expect(toast.error).toHaveBeenCalledWith("“notes.txt” 不是支持的附件。请使用 PNG、JPEG、GIF、WebP 或 PDF。");

    fireEvent.change(input, { target: { files: [makeFile("huge.png", "image/png", 21 * 1024 * 1024)] } });
    expect(toast.error).toHaveBeenCalledWith("“huge.png” 过大。最大为 20 MB。");
  });
});
