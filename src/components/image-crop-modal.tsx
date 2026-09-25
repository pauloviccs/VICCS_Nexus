import { useEffect, useRef, useState } from "react";
import {
  Crop,
  Download,
  FlipHorizontal,
  FlipVertical,
  Image as ImageIcon,
  LoaderCircle,
  Maximize2,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Sun,
  Upload,
  Sliders,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";

interface ImageCropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialImageSrc?: string | null;
  onComplete: (result: { url: string; blob: Blob }) => void;
}

type AspectRatioOption = "16:9" | "4:3" | "1:1" | "free";

export function ImageCropModal({
  open,
  onOpenChange,
  initialImageSrc,
  onComplete,
}: ImageCropModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Aspect ratio
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>("16:9");

  // Adjustments state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0); // in degrees
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [brightness, setBrightness] = useState(100); // 50 to 150
  const [contrast, setContrast] = useState(100); // 50 to 150
  const [saturation, setSaturation] = useState(100); // 0 to 200

  // Dragging state for pan
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);

  // Reset when dialog opens with initial image
  useEffect(() => {
    if (open) {
      if (initialImageSrc) {
        setImageSrc(initialImageSrc);
      }
      resetAdjustments();
    }
  }, [open, initialImageSrc]);

  // Load image object whenever imageSrc changes
  useEffect(() => {
    if (!imageSrc) {
      imageElementRef.current = null;
      return;
    }

    setLoading(true);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageElementRef.current = img;
      setLoading(false);
      drawPreview();
    };
    img.onerror = () => {
      setLoading(false);
      toast.error("Não foi possível carregar a imagem informada.");
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Redraw preview whenever any adjustment changes
  useEffect(() => {
    if (imageElementRef.current && !loading) {
      drawPreview();
    }
  }, [zoom, pan, rotation, flipH, flipV, brightness, contrast, saturation, aspectRatio, loading]);

  function resetAdjustments() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setAspectRatio("16:9");
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Formato inválido. Aceitamos apenas imagens JPEG, PNG e WebP.");
      return;
    }

    // Carregar como URL local
    const objectUrl = URL.createObjectURL(file);
    setImageSrc(objectUrl);
    resetAdjustments();
    toast.success(`Imagem "${file.name}" carregada.`);
  }

  // Draw on the visible interactive preview canvas
  function drawPreview() {
    const canvas = previewCanvasRef.current;
    const img = imageElementRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Define target dimensions based on aspect ratio
    let targetW = 640;
    let targetH = 360; // 16:9 default

    if (aspectRatio === "4:3") {
      targetW = 640;
      targetH = 480;
    } else if (aspectRatio === "1:1") {
      targetW = 500;
      targetH = 500;
    } else if (aspectRatio === "free") {
      const imgRatio = img.naturalWidth / img.naturalHeight || 16 / 9;
      targetW = 640;
      targetH = Math.round(640 / imgRatio);
    }

    canvas.width = targetW;
    canvas.height = targetH;

    ctx.clearRect(0, 0, targetW, targetH);

    // Apply color filters
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

    ctx.save();
    // Center transformations
    ctx.translate(targetW / 2 + pan.x, targetH / 2 + pan.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -zoom : zoom, flipV ? -zoom : zoom);

    // Calculate base draw size to cover the canvas
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const targetAspect = targetW / targetH;

    let drawW: number;
    let drawH: number;

    if (imgAspect > targetAspect) {
      drawH = targetH;
      drawW = targetH * imgAspect;
    } else {
      drawW = targetW;
      drawH = targetW / imgAspect;
    }

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }

  // Handle dragging the image to pan
  function handleMouseDown(e: React.MouseEvent) {
    if (!imageElementRef.current) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy,
    });
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  // Render high-res offscreen canvas and upload to Supabase Storage
  async function applyAndUpload() {
    const img = imageElementRef.current;
    if (!img) {
      toast.error("Nenhuma imagem selecionada para aplicar.");
      return;
    }

    setUploading(true);
    const toastId = toast.loading("Processando e enviando imagem...");

    try {
      // High-res output dimensions
      let outW = 1920;
      let outH = 1080;

      if (aspectRatio === "4:3") {
        outW = 1600;
        outH = 1200;
      } else if (aspectRatio === "1:1") {
        outW = 1200;
        outH = 1200;
      } else if (aspectRatio === "free") {
        const imgRatio = img.naturalWidth / img.naturalHeight || 16 / 9;
        outW = 1920;
        outH = Math.round(1920 / imgRatio);
      }

      const offscreen = document.createElement("canvas");
      offscreen.width = outW;
      offscreen.height = outH;
      const ctx = offscreen.getContext("2d");

      if (!ctx) throw new Error("Contexto de Canvas não disponível.");

      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

      // Scale pan relative to high-res canvas
      const scaleFactor = outW / (previewCanvasRef.current?.width || 640);
      const highResPanX = pan.x * scaleFactor;
      const highResPanY = pan.y * scaleFactor;

      ctx.save();
      ctx.translate(outW / 2 + highResPanX, outH / 2 + highResPanY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -zoom : zoom, flipV ? -zoom : zoom);

      const imgAspect = img.naturalWidth / img.naturalHeight;
      const targetAspect = outW / outH;
      let drawW: number;
      let drawH: number;

      if (imgAspect > targetAspect) {
        drawH = outH;
        drawW = outH * imgAspect;
      } else {
        drawW = outW;
        drawH = outW / imgAspect;
      }

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // Convert to WebP blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        offscreen.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error("Falha ao gerar arquivo da imagem."));
          },
          "image/webp",
          0.92
        );
      });

      const dataUrl = offscreen.toDataURL("image/webp", 0.92);

      // Upload to Supabase Storage 'project-covers'
      const fileName = `cover_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.webp`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("project-covers")
        .upload(fileName, blob, {
          contentType: "image/webp",
          upsert: true,
        });

      let finalUrl = dataUrl;

      if (uploadError) {
        console.warn("[Storage] Fallback to dataUrl devido a erro de storage:", uploadError.message);
        toast.warning("Imagem processada localmente. (Supabase Storage indisponível)", { id: toastId });
      } else {
        const { data: publicUrlData } = supabase.storage
          .from("project-covers")
          .getPublicUrl(uploadData.path);

        finalUrl = publicUrlData.publicUrl;
        toast.success("Capa enviada e armazenada com sucesso no Supabase Storage!", { id: toastId });
      }

      onComplete({ url: finalUrl, blob });
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao aplicar ajustes da imagem.", { id: toastId });
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-deep max-h-[92vh] max-w-4xl overflow-y-auto border-border/60 p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <Crop className="size-5 text-primary" /> Recorte e Ajustes da Capa
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Ajuste o enquadramento, zoom, rotação e tratamento de cores da capa do projeto (aceita JPEG, PNG e WebP).
          </DialogDescription>
        </DialogHeader>

        {/* Action Bar: File selector & Presets */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-4 pt-1">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2 rounded-lg bg-background/40 hover:bg-background/80"
            >
              <Upload className="size-4" /> Escolher Arquivo Local
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            <span className="text-xs text-muted-foreground">JPEG, PNG ou WebP</span>
          </div>

          {/* Aspect Ratio Selector */}
          <div className="flex items-center gap-1 rounded-xl bg-background/50 p-1 border border-border/40">
            <span className="px-2 text-xs font-medium text-muted-foreground">Proporção:</span>
            {(
              [
                { label: "16:9 (Hub)", value: "16:9" },
                { label: "4:3", value: "4:3" },
                { label: "1:1", value: "1:1" },
                { label: "Livre", value: "free" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAspectRatio(opt.value)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  aspectRatio === opt.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Viewport de Recorte Interativo */}
        <div className="relative my-2 flex min-h-[300px] sm:min-h-[360px] items-center justify-center overflow-hidden rounded-2xl border border-border/50 bg-black/60 p-2">
          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-sm">
              <LoaderCircle className="size-8 animate-spin text-primary" />
            </div>
          )}

          {!imageSrc ? (
            <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                <ImageIcon className="size-10 text-muted-foreground/60" />
              </div>
              <p className="text-sm font-medium text-foreground">Nenhuma imagem selecionada</p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Clique no botão acima ou selecione um arquivo JPEG, PNG ou WebP do seu computador para começar.
              </p>
              <Button
                type="button"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 rounded-xl"
              >
                Carregar Imagem do Computador
              </Button>
            </div>
          ) : (
            <div
              className={`relative cursor-grab overflow-hidden rounded-xl border border-primary/30 shadow-2xl transition-shadow select-none ${
                isDragging ? "cursor-grabbing shadow-primary/20" : ""
              }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{
                maxWidth: "100%",
                maxHeight: "360px",
              }}
            >
              <canvas
                ref={previewCanvasRef}
                className="block max-h-[360px] max-w-full object-contain"
              />

              {/* Guia Visual Fotográfica (Regra dos Terços) */}
              <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30 border border-white/20">
                <div className="border-b border-r border-dashed border-white/40" />
                <div className="border-b border-r border-dashed border-white/40" />
                <div className="border-b border-dashed border-white/40" />
                <div className="border-b border-r border-dashed border-white/40" />
                <div className="border-b border-r border-dashed border-white/40" />
                <div className="border-b border-dashed border-white/40" />
                <div className="border-r border-dashed border-white/40" />
                <div className="border-r border-dashed border-white/40" />
                <div />
              </div>

              {/* Indicador de arraste */}
              <div className="pointer-events-none absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] text-white/70 backdrop-blur-xs">
                Arrastar para enquadrar
              </div>
            </div>
          )}
        </div>

        {/* Controles e Sliders de Ajuste Fino */}
        {imageSrc && (
          <div className="mt-3 space-y-4 rounded-2xl border border-border/40 bg-muted/15 p-4">
            {/* Linha 1: Ferramentas de Transformação (Zoom, Rotação e Espelhamento) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Zoom */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <Label className="text-muted-foreground flex items-center gap-1.5">
                    <Maximize2 className="size-3.5 text-primary" /> Zoom
                  </Label>
                  <span className="font-mono text-xs">{zoom.toFixed(1)}x</span>
                </div>
                <Slider
                  value={[zoom]}
                  min={1}
                  max={3}
                  step={0.05}
                  onValueChange={([val]) => setZoom(val)}
                  className="py-1"
                />
              </div>

              {/* Rotação fina */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <Label className="text-muted-foreground flex items-center gap-1.5">
                    <RefreshCw className="size-3.5 text-primary" /> Rotação Fina
                  </Label>
                  <span className="font-mono text-xs">{rotation}°</span>
                </div>
                <Slider
                  value={[rotation]}
                  min={-45}
                  max={45}
                  step={1}
                  onValueChange={([val]) => setRotation(val)}
                  className="py-1"
                />
              </div>

              {/* Botões Rápidos de Rotação e Espelhamento */}
              <div className="flex items-center gap-1.5 sm:col-span-2 lg:col-span-1 justify-end pt-3 sm:pt-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  title="Girar 90° para a esquerda"
                  onClick={() => setRotation((r) => (r - 90) % 360)}
                  className="h-8 px-2.5 rounded-lg bg-background/40"
                >
                  <RotateCcw className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  title="Girar 90° para a direita"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="h-8 px-2.5 rounded-lg bg-background/40"
                >
                  <RotateCw className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant={flipH ? "default" : "outline"}
                  size="sm"
                  title="Inverter horizontalmente"
                  onClick={() => setFlipH((f) => !f)}
                  className="h-8 px-2.5 rounded-lg"
                >
                  <FlipHorizontal className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant={flipV ? "default" : "outline"}
                  size="sm"
                  title="Inverter verticalmente"
                  onClick={() => setFlipV((f) => !f)}
                  className="h-8 px-2.5 rounded-lg"
                >
                  <FlipVertical className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  title="Resetar todos os ajustes"
                  onClick={resetAdjustments}
                  className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  Resetar
                </Button>
              </div>
            </div>

            {/* Linha 2: Tratamento de Cor & Iluminação */}
            <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-3 border-t border-border/30">
              {/* Brilho */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <Label className="text-muted-foreground flex items-center gap-1.5">
                    <Sun className="size-3.5 text-amber-400" /> Brilho
                  </Label>
                  <span className="font-mono text-xs">{brightness}%</span>
                </div>
                <Slider
                  value={[brightness]}
                  min={50}
                  max={150}
                  step={1}
                  onValueChange={([val]) => setBrightness(val)}
                  className="py-1"
                />
              </div>

              {/* Contraste */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <Label className="text-muted-foreground flex items-center gap-1.5">
                    <Sliders className="size-3.5 text-blue-400" /> Contraste
                  </Label>
                  <span className="font-mono text-xs">{contrast}%</span>
                </div>
                <Slider
                  value={[contrast]}
                  min={50}
                  max={150}
                  step={1}
                  onValueChange={([val]) => setContrast(val)}
                  className="py-1"
                />
              </div>

              {/* Saturação */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <Label className="text-muted-foreground flex items-center gap-1.5">
                    <Sliders className="size-3.5 text-emerald-400" /> Saturação
                  </Label>
                  <span className="font-mono text-xs">{saturation}%</span>
                </div>
                <Slider
                  value={[saturation]}
                  min={0}
                  max={200}
                  step={1}
                  onValueChange={([val]) => setSaturation(val)}
                  className="py-1"
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/40">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={uploading}
            className="rounded-xl text-muted-foreground"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={applyAndUpload}
            disabled={!imageSrc || uploading || loading}
            className="gap-2 rounded-xl px-5"
          >
            {uploading ? (
              <>
                <LoaderCircle className="size-4 animate-spin" /> Salvando Capa...
              </>
            ) : (
              <>
                <Check className="size-4" /> Aplicar e Salvar Capa
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
