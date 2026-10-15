import { HardwareInfo } from '../types';

export async function detectHardware(): Promise<HardwareInfo> {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent || ''
  ) || (window.innerWidth <= 768);

  const logicalCores = navigator.hardwareConcurrency || 4;

  let estimatedMemoryGB: number | undefined;
  if ('deviceMemory' in navigator) {
    estimatedMemoryGB = (navigator as unknown as { deviceMemory: number }).deviceMemory;
  }

  let webgpuSupported = false;
  let gpuAdapterName: string | undefined;

  if (typeof navigator !== 'undefined' && 'gpu' in navigator && navigator.gpu) {
    try {
      const adapter = await (navigator.gpu as { requestAdapter: () => Promise<{ info?: { description?: string; device?: string; vendor?: string } } | null> }).requestAdapter();
      if (adapter) {
        webgpuSupported = true;
        if (adapter.info) {
          gpuAdapterName = adapter.info.description || `${adapter.info.vendor || ''} ${adapter.info.device || ''}`.trim() || 'Generic GPU';
        } else {
          gpuAdapterName = 'Supported WebGPU Adapter';
        }
      }
    } catch {
      webgpuSupported = false;
    }
  }

  let storageQuota: { usedMB: number; totalMB: number } | undefined;
  if ('storage' in navigator && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      if (estimate.usage !== undefined && estimate.quota !== undefined) {
        storageQuota = {
          usedMB: Math.round(estimate.usage / (1024 * 1024)),
          totalMB: Math.round(estimate.quota / (1024 * 1024)),
        };
      }
    } catch {
      // Storage estimation optional
    }
  }

  return {
    webgpuSupported,
    gpuAdapterName,
    logicalCores,
    estimatedMemoryGB,
    isMobile,
    storageQuota,
  };
}
