'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ImageToolTab,
  PipelineSettings,
  ImageFileItem,
  PipelineRenderResult,
  BatchItem,
  BatchProgress,
} from '../types/image-tools.types';
import {
  loadImage,
  createDefaultPipelineSettings,
  renderPipeline,
} from '../services/image-pipeline.service';
import { createZipArchive, createZipArchiveChunked, ZipFileEntry } from '../services/zip-export.service';
import { WorkerPoolService } from '../services/worker-pool.service';
import { formatAspectRatio, calculateGcd } from '@/features/encoders-decoders/services/image-detection.service';
import { ImageToolbar } from './ImageToolbar';
import { ImageDropzone } from './ImageDropzone';
import { ImageCanvasViewport } from './ImageCanvasViewport';
import { ImageInspector } from './ImageInspector';
import { ImageBatchQueue } from './ImageBatchQueue';
import { Image as ImageIcon, Sliders, Layers } from 'lucide-react';

interface ImageToolsWorkspaceProps {
  initialTab?: ImageToolTab;
}

export const ImageToolsWorkspace: React.FC<ImageToolsWorkspaceProps> = ({
  initialTab = 'crop',
}) => {
  // Navigation & Tool State
  const [activeTab, setActiveTab] = useState<ImageToolTab>(initialTab);
  const [mobileTab, setMobileTab] = useState<'canvas' | 'inspector' | 'batch'>('canvas');

  // Loaded Files
  const [files, setFiles] = useState<ImageFileItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Loaded HTMLImageElement cache for active file
  const activeImageRef = useRef<HTMLImageElement | null>(null);

  // Non-destructive Settings & Undo/Redo History
  const [settings, setSettings] = useState<PipelineSettings | null>(null);
  const [historyPast, setHistoryPast] = useState<PipelineSettings[]>([]);
  const [historyFuture, setHistoryFuture] = useState<PipelineSettings[]>([]);

  // Pipeline Render Output
  const [renderResult, setRenderResult] = useState<PipelineRenderResult | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(false);

  // Viewport Settings
  const [zoom, setZoom] = useState<number>(100);
  const [isCompareActive, setIsCompareActive] = useState<boolean>(false);
  const [isBatchOpen, setIsBatchOpen] = useState<boolean>(false);

  // Batch Queue & Worker State (Phase D)
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);
  const [isProcessingBatch, setIsProcessingBatch] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Active File Reference
  const currentFile = files.find((f) => f.id === activeId) || null;

  // Cleanup Object URLs and Worker Pool on unmount
  useEffect(() => {
    return () => {
      files.forEach((f) => URL.revokeObjectURL(f.originalUrl));
      batchItems.forEach((b) => {
        if (b.outputUrl) URL.revokeObjectURL(b.outputUrl);
      });
      if (renderResult?.objectUrl) {
        URL.revokeObjectURL(renderResult.objectUrl);
      }
      WorkerPoolService.getInstance().terminateAllWorkers();
    };
  }, []);

  // Live update without pushing to history (used during slider drag / crop move)
  const handleLiveSettings = useCallback(
    (updater: (prev: PipelineSettings) => PipelineSettings) => {
      setSettings((current) => (current ? updater(current) : current));
    },
    []
  );

  // Commit update with History Stack Push (used on pointerUp / blur / button click)
  const handleCommitSettings = useCallback(
    (updater: (prev: PipelineSettings) => PipelineSettings) => {
      setSettings((current) => {
        if (!current) return current;
        const next = updater(current);
        setHistoryPast((past) => [...past.slice(-29), current]);
        setHistoryFuture([]); // clear redo branch
        return next;
      });
    },
    []
  );

  // Legacy alias for full updates
  const handleUpdateSettings = handleCommitSettings;

  // Undo Action
  const handleUndo = useCallback(() => {
    if (historyPast.length === 0 || !settings) return;
    const previous = historyPast[historyPast.length - 1];
    setHistoryPast((past) => past.slice(0, -1));
    setHistoryFuture((future) => [settings, ...future]);
    setSettings(previous);
  }, [historyPast, settings]);

  // Redo Action
  const handleRedo = useCallback(() => {
    if (historyFuture.length === 0 || !settings) return;
    const next = historyFuture[0];
    setHistoryFuture((future) => future.slice(1));
    setHistoryPast((past) => [...past, settings]);
    setSettings(next);
  }, [historyFuture, settings]);

  // Reset Adjustments
  const handleResetAll = useCallback(() => {
    if (!currentFile) return;
    const defaults = createDefaultPipelineSettings(currentFile.width, currentFile.height);
    handleUpdateSettings(() => defaults);
  }, [currentFile, handleUpdateSettings]);

  // Reset Specific Tab
  const handleResetTab = useCallback(
    (tab: ImageToolTab) => {
      if (!currentFile) return;
      const defaults = createDefaultPipelineSettings(currentFile.width, currentFile.height);
      handleUpdateSettings((prev) => {
        if (tab === 'crop') return { ...prev, crop: defaults.crop };
        if (tab === 'resize') return { ...prev, resize: defaults.resize };
        if (tab === 'rotate') return { ...prev, orientation: defaults.orientation };
        if (tab === 'compress') return { ...prev, export: { ...prev.export, quality: 0.85 } };
        if (tab === 'convert') return { ...prev, export: { ...prev.export, format: 'auto' } };
        if (tab === 'watermark') return { ...prev, watermark: defaults.watermark };
        return prev;
      });
    },
    [currentFile, handleUpdateSettings]
  );

  // File Ingestion Handler
  const handleFilesSelected = async (selectedFiles: File[]) => {
    try {
      const newItems: ImageFileItem[] = [];

      for (const file of selectedFiles) {
        const img = await loadImage(file);
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        const objectUrl = URL.createObjectURL(file);
        const id = `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        newItems.push({
          id,
          file,
          name: file.name,
          sizeBytes: file.size,
          mimeType: file.type || 'image/png',
          originalUrl: objectUrl,
          width: w,
          height: h,
          aspectRatio: formatAspectRatio(w, h),
        });
      }

      setFiles((prev) => [...prev, ...newItems]);
      setBatchItems((prev) => [
        ...prev,
        ...newItems.map((item) => ({
          id: item.id,
          file: item.file,
          name: item.name,
          sizeBytes: item.sizeBytes,
          width: item.width,
          height: item.height,
          status: 'idle' as const,
        })),
      ]);

      // If no active file, set the first new file
      if (!activeId && newItems.length > 0) {
        const first = newItems[0];
        setActiveId(first.id);
        const defaults = createDefaultPipelineSettings(first.width, first.height);
        setSettings(defaults);
        setHistoryPast([]);
        setHistoryFuture([]);
      }
    } catch (err) {
      console.error('Failed to load image files:', err);
    }
  };

  // Demo Sample Generator
  const handleLoadSample = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 1200, 800);
    grad.addColorStop(0, '#0369a1');
    grad.addColorStop(0.5, '#0f172a');
    grad.addColorStop(1, '#070b14');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 800);

    // Decorative geometric shapes
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.beginPath();
    ctx.arc(250, 400, 200, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(45, 212, 191, 0.15)';
    ctx.beginPath();
    ctx.arc(950, 350, 240, 0, Math.PI * 2);
    ctx.fill();

    // Center badge
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 56px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FormatNook Image Tools', 600, 380);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('100% Client-Side Image Processing • 1200 × 800 Demo Asset', 600, 440);

    canvas.toBlob((blob) => {
      if (blob) {
        const demoFile = new File([blob], 'formatnook-sample.png', { type: 'image/png' });
        handleFilesSelected([demoFile]);
      }
    }, 'image/png');
  };

  // Reload Image element when active file changes
  useEffect(() => {
    if (!currentFile) {
      activeImageRef.current = null;
      return;
    }
    let isMounted = true;
    loadImage(currentFile.file).then((img) => {
      if (isMounted) {
        activeImageRef.current = img;
        // Trigger render
        if (settings) {
          triggerRender(img, settings);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [currentFile?.id]);

  // Debounced pipeline render trigger
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerRender = useCallback(
    (img: HTMLImageElement, currentSettings: PipelineSettings) => {
      if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
      setIsRendering(true);

      renderTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await renderPipeline(img, currentSettings, currentFile?.mimeType);
          setRenderResult((prev) => {
            if (prev?.objectUrl) URL.revokeObjectURL(prev.objectUrl);
            return res;
          });
        } catch (err) {
          console.error('Pipeline render failure:', err);
        } finally {
          setIsRendering(false);
        }
      }, 75);
    },
    [currentFile?.mimeType]
  );

  // Trigger render when settings change
  useEffect(() => {
    if (activeImageRef.current && settings) {
      triggerRender(activeImageRef.current, settings);
    }
  }, [settings, triggerRender]);

  // Download Output File
  const handleDownloadOutput = async () => {
    if (!currentFile || !settings) return;

    // Check if crop area is selected or active
    const shouldCrop =
      settings.crop.enabled ||
      (settings.crop.rect &&
        (settings.crop.rect.x > 0 ||
          settings.crop.rect.y > 0 ||
          settings.crop.rect.width < currentFile.width ||
          settings.crop.rect.height < currentFile.height));

    const finalSettings: PipelineSettings = shouldCrop && !settings.crop.enabled
      ? { ...settings, crop: { ...settings.crop, enabled: true } }
      : settings;

    let targetUrl: string | null = null;
    let cleanupNeeded = false;

    if (activeImageRef.current) {
      const freshResult = await renderPipeline(activeImageRef.current, finalSettings, currentFile.mimeType);
      targetUrl = freshResult.objectUrl;
      cleanupNeeded = true;
    } else if (renderResult?.objectUrl) {
      targetUrl = renderResult.objectUrl;
    } else {
      const img = await loadImage(currentFile.file);
      activeImageRef.current = img;
      const freshResult = await renderPipeline(img, finalSettings, currentFile.mimeType);
      targetUrl = freshResult.objectUrl;
      cleanupNeeded = true;
    }

    if (!targetUrl) return;

    const a = document.createElement('a');
    a.href = targetUrl;

    const baseName = currentFile.name.replace(/\.[^/.]+$/, '');
    let ext = '.png';
    if (finalSettings.export.format === 'image/jpeg') ext = '.jpg';
    else if (finalSettings.export.format === 'image/webp') ext = '.webp';
    else if (finalSettings.export.format === 'image/avif') ext = '.avif';

    const suffix = shouldCrop ? '-cropped' : '-processed';
    a.download = `${baseName}${suffix}${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (cleanupNeeded && targetUrl !== renderResult?.objectUrl) {
      setTimeout(() => URL.revokeObjectURL(targetUrl!), 2000);
    }
  };

  // Batch Processing Handlers (Phase D)
  const handleStartBatchProcessing = async () => {
    if (batchItems.length === 0 || !settings) return;
    setIsProcessingBatch(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      await WorkerPoolService.getInstance().processBatch(
        batchItems,
        settings,
        {
          onItemUpdate: (updated) => {
            setBatchItems((prev) =>
              prev.map((it) => (it.id === updated.id ? updated : it))
            );
          },
          onBatchProgress: (prog) => {
            setBatchProgress(prog);
          },
        },
        controller.signal
      );
    } catch (err) {
      console.error('Batch processing failed:', err);
    } finally {
      setIsProcessingBatch(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelBatchProcessing = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsProcessingBatch(false);
    }
  };

  const handleRetryItem = async (id: string) => {
    const item = batchItems.find((it) => it.id === id);
    if (!item || !settings) return;

    setBatchItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, status: 'processing', error: undefined } : it))
    );

    try {
      const processed = await WorkerPoolService.getInstance().processItem(item, settings);
      setBatchItems((prev) =>
        prev.map((it) => (it.id === id ? processed : it))
      );
    } catch (err: any) {
      setBatchItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, status: 'error', error: err?.message || 'Retry failed' } : it))
      );
    }
  };

  const handleDownloadAllZip = async () => {
    if (batchItems.length === 0 || !settings) return;

    let currentBatch = batchItems;
    const hasDone = currentBatch.some((it) => it.status === 'done' && it.outputBlob);

    // If no files have been rendered yet, run the batch first
    if (!hasDone) {
      setIsProcessingBatch(true);
      const controller = new AbortController();
      abortControllerRef.current = controller;
      try {
        currentBatch = await WorkerPoolService.getInstance().processBatch(
          currentBatch,
          settings,
          {
            onItemUpdate: (updated) => {
              setBatchItems((prev) =>
                prev.map((it) => (it.id === updated.id ? updated : it))
              );
            },
            onBatchProgress: (prog) => {
              setBatchProgress(prog);
            },
          },
          controller.signal
        );
      } finally {
        setIsProcessingBatch(false);
        abortControllerRef.current = null;
      }
    }

    const readyItems = currentBatch.filter((it) => it.status === 'done' && it.outputBlob);
    if (readyItems.length === 0) return;

    let ext = '.png';
    if (settings.export.format === 'image/jpeg') ext = '.jpg';
    else if (settings.export.format === 'image/webp') ext = '.webp';
    else if (settings.export.format === 'image/avif') ext = '.avif';

    const zipEntries = readyItems.map((item) => {
      const baseName = item.name.replace(/\.[^/.]+$/, '');
      return {
        name: `${baseName}-processed${ext}`,
        data: item.outputBlob!,
      };
    });

    try {
      const zipBlob = await createZipArchiveChunked(zipEntries);
      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `formatnook-batch-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(zipUrl), 2000);
    } catch (err) {
      console.error('Failed to create batch ZIP export:', err);
    }
  };

  // Keyboard Shortcuts (Undo, Redo, Download)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleDownloadOutput();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, handleDownloadOutput]);

  // Empty State: Render Dropzone
  if (files.length === 0 || !currentFile || !settings) {
    return (
      <div className="workspace-container image-workspace-empty" data-testid="image-tools-workspace">
        <ImageDropzone
          onFilesSelected={handleFilesSelected}
          onLoadSample={handleLoadSample}
        />
      </div>
    );
  }

  // Active State: Render Toolbar, Canvas Viewport & Inspector
  return (
    <div className="workspace-container image-tools-workspace" data-testid="image-tools-workspace">
      {/* Two-Tier Primary & Secondary Toolbar */}
      <ImageToolbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setMobileTab('inspector');
        }}
        canUndo={historyPast.length > 0}
        canRedo={historyFuture.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onReset={handleResetAll}
        onDownload={handleDownloadOutput}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(500, z + 25))}
        onZoomOut={() => setZoom((z) => Math.max(25, z - 25))}
        onZoomReset={() => setZoom(100)}
        isCompareActive={isCompareActive}
        onToggleCompare={() => setIsCompareActive((prev) => !prev)}
        batchCount={files.length}
        isBatchOpen={isBatchOpen}
        onToggleBatch={() => setIsBatchOpen((prev) => !prev)}
        isProcessing={isRendering}
      />

      {/* Mobile Ergonomic Segment Navigation */}
      <div className="workspace-mobile-tabs image-mobile-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'canvas'}
          className={`workspace-mobile-tab-btn ${mobileTab === 'canvas' ? 'active' : ''}`}
          onClick={() => setMobileTab('canvas')}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Canvas</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'inspector'}
          className={`workspace-mobile-tab-btn ${mobileTab === 'inspector' ? 'active' : ''}`}
          onClick={() => setMobileTab('inspector')}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Adjustments</span>
        </button>
        {files.length >= 1 && (
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === 'batch'}
            className={`workspace-mobile-tab-btn ${mobileTab === 'batch' ? 'active' : ''}`}
            onClick={() => setMobileTab('batch')}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Batch ({files.length})</span>
          </button>
        )}
      </div>

      {/* Main Workspace Split View (65% Canvas / 35% Inspector) */}
      <div className="image-workspace-grid">
        {/* Left: Viewport (Hidden on mobile if inspector tab active) */}
        <div className={`image-grid-canvas-col ${mobileTab !== 'canvas' ? 'mobile-hidden' : ''}`}>
          <ImageCanvasViewport
            currentFile={currentFile}
            renderResult={renderResult}
            zoom={zoom}
            isCompareActive={isCompareActive}
            onToggleCompare={() => setIsCompareActive((prev) => !prev)}
            onResetZoom={() => setZoom(100)}
            isRendering={isRendering}
            activeTab={activeTab}
            cropSettings={settings.crop}
            onChangeCropRect={(newRect) => {
              const isCropActive =
                newRect.x > 0 ||
                newRect.y > 0 ||
                newRect.width < currentFile.width ||
                newRect.height < currentFile.height;
              handleLiveSettings((prev) => ({
                ...prev,
                crop: { ...prev.crop, enabled: isCropActive, rect: newRect },
              }));
            }}
            onCommitCropRect={(newRect) => {
              const isCropActive =
                newRect.x > 0 ||
                newRect.y > 0 ||
                newRect.width < currentFile.width ||
                newRect.height < currentFile.height;
              handleCommitSettings((prev) => ({
                ...prev,
                crop: { ...prev.crop, enabled: isCropActive, rect: newRect },
              }));
            }}
          />
        </div>

        {/* Right: Inspector (Hidden on mobile if canvas tab active) */}
        <div className={`image-grid-inspector-col ${mobileTab !== 'inspector' ? 'mobile-hidden' : ''}`}>
          <ImageInspector
            activeTab={activeTab}
            settings={settings}
            onUpdateSettings={handleLiveSettings}
            onCommitSettings={handleCommitSettings}
            currentFile={currentFile}
            renderResult={renderResult}
            onResetTabSettings={handleResetTab}
            onDownload={handleDownloadOutput}
            onApplyToBatch={handleDownloadAllZip}
            batchCount={files.length}
            isProcessing={isRendering || isProcessingBatch}
          />
        </div>
      </div>

      {/* Batch Processing Tray */}
      <ImageBatchQueue
        isOpen={isBatchOpen || mobileTab === 'batch'}
        onClose={() => setIsBatchOpen(false)}
        items={batchItems}
        batchProgress={batchProgress}
        onStartBatchProcessing={handleStartBatchProcessing}
        onCancelBatchProcessing={handleCancelBatchProcessing}
        onRetryItem={handleRetryItem}
        activeId={activeId}
        onSelectActive={(id) => {
          setActiveId(id);
          const target = files.find((f) => f.id === id);
          if (target) {
            const defaults = createDefaultPipelineSettings(target.width, target.height);
            setSettings(defaults);
            setHistoryPast([]);
            setHistoryFuture([]);
          }
          if (mobileTab === 'batch') setMobileTab('canvas');
        }}
        onRemoveItem={(id) => {
          setFiles((prev) => prev.filter((f) => f.id !== id));
          setBatchItems((prev) => prev.filter((it) => it.id !== id));
          if (activeId === id) {
            const remaining = files.filter((f) => f.id !== id);
            if (remaining.length > 0) {
              setActiveId(remaining[0].id);
            } else {
              setActiveId(null);
              setSettings(null);
            }
          }
        }}
        onClearAll={() => {
          setFiles([]);
          setBatchItems([]);
          setBatchProgress(null);
          setActiveId(null);
          setSettings(null);
        }}
        onAddFiles={handleFilesSelected}
        onDownloadItem={(item) => {
          const targetBlob = item.outputBlob;
          if (targetBlob) {
            let ext = '.png';
            if (settings?.export.format === 'image/jpeg') ext = '.jpg';
            else if (settings?.export.format === 'image/webp') ext = '.webp';
            else if (settings?.export.format === 'image/avif') ext = '.avif';
            const baseName = item.name.replace(/\.[^/.]+$/, '');
            const a = document.createElement('a');
            const url = URL.createObjectURL(targetBlob);
            a.href = url;
            a.download = `${baseName}-processed${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 2000);
          } else {
            const a = document.createElement('a');
            const url = URL.createObjectURL(item.file);
            a.href = url;
            a.download = item.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 2000);
          }
        }}
        onDownloadAllZip={handleDownloadAllZip}
        isProcessingBatch={isProcessingBatch}
      />
    </div>
  );
};
