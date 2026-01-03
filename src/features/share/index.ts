// Share feature barrel file
// OPTIMIZED: Direct exports from source files (no nested barrel chains)

// ============== API ==============
export { ShareService, shareService } from './api/share-service';
export { SophisticatedShareService, sophisticatedShareService } from './api/sophisticated-share';

// Convenience functions that delegate to shareService instance
export const shareDocument = (documentId: string, options?: any) =>
  import('./api/share-service').then(m => m.shareService.share(documentId, options));
export const revokeShare = (shareId: string) =>
  import('./api/share-service').then(m => m.shareService.revoke(shareId));
export const getShareInfo = (shareId: string) =>
  import('./api/share-service').then(m => m.shareService.getInfo(shareId));
