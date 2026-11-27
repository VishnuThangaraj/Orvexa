import React, { useEffect, useState } from "react";
import { driveApi } from "../api/drive.api";

interface DriveThumbnailProps {
  fileId: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallback: React.ReactNode;
}

interface ThumbnailState {
  requestKey: string;
  blobUrl: string | null;
  failed: boolean;
}

/**
 * Renders an authenticated Drive image thumbnail via Blob Object URL with fallback.
 */
export const DriveThumbnail: React.FC<DriveThumbnailProps> = ({
  fileId,
  alt,
  width = 320,
  height = 200,
  className,
  fallback,
}) => {
  const requestKey = `${fileId}:${width}:${height}`;
  const [state, setState] = useState<ThumbnailState>({
    requestKey: "",
    blobUrl: null,
    failed: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl: string | null = null;

    driveApi
      .fetchThumbnailBlobUrl(fileId, {
        width,
        height,
        signal: controller.signal,
      })
      .then((url) => {
        if (controller.signal.aborted) {
          window.URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setState({ requestKey, blobUrl: url, failed: false });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setState({ requestKey, blobUrl: null, failed: true });
        }
      });

    return () => {
      controller.abort();
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
      }
    };
  }, [fileId, width, height, requestKey]);

  const activeUrl = state.requestKey === requestKey ? state.blobUrl : null;
  const hasFailed = state.requestKey === requestKey && state.failed;

  if (hasFailed || !activeUrl) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={activeUrl}
      alt={alt}
      onError={() => setState({ requestKey, blobUrl: null, failed: true })}
      className={className}
    />
  );
};

export default DriveThumbnail;
