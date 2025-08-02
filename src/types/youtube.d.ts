declare global {
  interface Window {
    YT: {
      Player: new (elementId: string, config: {
        height: string;
        width: string;
        videoId: string;
        playerVars: Record<string, any>;
        events: Record<string, (event: any) => void>;
      }) => {
        playVideo: () => void;
        pauseVideo: () => void;
        seekTo: (seconds: number, allowSeekAhead: boolean) => void;
        setVolume: (volume: number) => void;
        mute: () => void;
        unMute: () => void;
        getVolume: () => number;
        getCurrentTime: () => number;
        getDuration: () => number;
        destroy: () => void;
      };
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

export {};