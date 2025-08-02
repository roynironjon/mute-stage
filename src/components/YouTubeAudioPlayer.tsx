import { useState, useEffect, useRef } from 'react';
import { Search, Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  duration?: string;
}

const YOUTUBE_API_KEY = 'AIzaSyBdMuIaujxNM1HEsMfkuYxct4o7CFrukkA';

export default function YouTubeAudioPlayer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<YouTubeVideo[]>([]);
  const [currentVideo, setCurrentVideo] = useState<YouTubeVideo | null>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([50]);
  const [progress, setProgress] = useState([0]);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [customImage, setCustomImage] = useState('');
  
  const playerRef = useRef<any>(null);
  const { toast } = useToast();

  // Load YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      
      window.onYouTubeIframeAPIReady = () => {
        console.log('YouTube API ready');
      };
    }
  }, []);

  const searchVideos = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(
          searchQuery
        )}&type=video&key=${YOUTUBE_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.error) {
        toast({
          title: "Error",
          description: data.error.message,
          variant: "destructive",
        });
        return;
      }
      
      const videos: YouTubeVideo[] = data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium.url,
        channelTitle: item.snippet.channelTitle,
      }));
      
      setSearchResults(videos);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search videos. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadVideo = (video: YouTubeVideo, index?: number) => {
    setCurrentVideo(video);
    
    // Set the current index if provided, otherwise find it in the results
    if (index !== undefined) {
      setCurrentVideoIndex(index);
    } else {
      const foundIndex = searchResults.findIndex(v => v.id === video.id);
      setCurrentVideoIndex(foundIndex);
    }
    
    if (playerRef.current) {
      playerRef.current.destroy();
    }
    
    playerRef.current = new window.YT.Player('youtube-player', {
      height: '0',
      width: '0',
      videoId: video.id,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
      },
      events: {
        onReady: (event: any) => {
          setDuration(event.target.getDuration());
          setVolume([event.target.getVolume()]);
        },
        onStateChange: (event: any) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true);
          } else if (event.data === window.YT.PlayerState.PAUSED) {
            setIsPlaying(false);
          }
        },
      },
    });
  };

  const playNextVideo = () => {
    if (searchResults.length > 0 && currentVideoIndex < searchResults.length - 1) {
      const nextIndex = currentVideoIndex + 1;
      loadVideo(searchResults[nextIndex], nextIndex);
    }
  };

  const playPreviousVideo = () => {
    if (searchResults.length > 0 && currentVideoIndex > 0) {
      const prevIndex = currentVideoIndex - 1;
      loadVideo(searchResults[prevIndex], prevIndex);
    }
  };

  const togglePlayPause = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value);
    if (playerRef.current) {
      playerRef.current.setVolume(value[0]);
      setIsMuted(value[0] === 0);
    }
  };

  const handleProgressChange = (value: number[]) => {
    setProgress(value);
    if (playerRef.current && duration > 0) {
      const newTime = (value[0] / 100) * duration;
      playerRef.current.seekTo(newTime, true);
    }
  };

  const toggleMute = () => {
    if (playerRef.current) {
      if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
        setVolume([50]);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
        setVolume([0]);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Update progress
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current && isPlaying) {
        const current = playerRef.current.getCurrentTime();
        setCurrentTime(current);
        if (duration > 0) {
          setProgress([(current / duration) * 100]);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            YouTube Audio Player
          </h1>
          <p className="text-muted-foreground">Search and play YouTube videos as audio only</p>
        </div>

        {/* Search */}
        <Card className="p-6 bg-gradient-to-br from-card to-player-card border-border/50">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search for music, podcasts, or any YouTube video..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchVideos()}
                className="pl-10 bg-secondary border-border/50 focus:border-primary"
              />
            </div>
            <Button 
              onClick={searchVideos}
              disabled={isLoading}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </Card>

        {/* Custom Image Input */}
        <Card className="p-6 bg-gradient-to-br from-card to-player-card border-border/50">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Custom Image for Player</h3>
            <Input
              placeholder="Enter image URL for the media player..."
              value={customImage}
              onChange={(e) => setCustomImage(e.target.value)}
              className="bg-secondary border-border/50 focus:border-primary"
            />
            {customImage && (
              <div className="mt-3">
                <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                <img
                  src={customImage}
                  alt="Custom preview"
                  className="w-32 h-24 object-cover rounded-md"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search Results */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-gradient-to-br from-card to-player-card border-border/50">
              <h3 className="text-xl font-semibold mb-4">Search Results</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {searchResults.map((video) => (
                  <div
                    key={video.id}
                    onClick={() => loadVideo(video)}
                    className="flex gap-4 p-3 rounded-lg bg-secondary hover:bg-secondary/80 cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                  >
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-20 h-15 object-cover rounded-md"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate text-sm">{video.title}</h4>
                      <p className="text-muted-foreground text-xs truncate">{video.channelTitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Audio Player */}
          <div className="space-y-6">
            {/* Now Playing Card */}
            {currentVideo && (
              <Card className="p-6 bg-gradient-to-br from-player-card to-card border-border/50 shadow-xl">
                <div className="text-center space-y-4">
                   <div className="relative">
                     <img
                       src={customImage || currentVideo.thumbnail}
                       alt={currentVideo.title}
                       className="w-full h-48 object-cover rounded-lg"
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-lg" />
                   </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm line-clamp-2">{currentVideo.title}</h3>
                    <p className="text-muted-foreground text-xs">{currentVideo.channelTitle}</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <Slider
                      value={progress}
                      onValueChange={handleProgressChange}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      onClick={playPreviousVideo}
                      disabled={currentVideoIndex <= 0 || searchResults.length === 0}
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                    >
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      onClick={togglePlayPause}
                      size="lg"
                      className="h-12 w-12 rounded-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                    >
                      {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                    </Button>
                    
                    <Button
                      onClick={playNextVideo}
                      disabled={currentVideoIndex >= searchResults.length - 1 || searchResults.length === 0}
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                    >
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Volume Control */}
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={toggleMute}
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                    >
                      {isMuted || volume[0] === 0 ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <Slider
                      value={volume}
                      onValueChange={handleVolumeChange}
                      max={100}
                      step={1}
                      className="flex-1"
                    />
                    
                    <span className="text-xs text-muted-foreground w-8">
                      {volume[0]}
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* User Profile Card */}
            <Card className="p-6 bg-gradient-to-br from-card to-player-card border-border/50">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-2xl font-bold text-white">
                  YT
                </div>
                <div>
                  <h3 className="font-semibold">Your Music Player</h3>
                  <p className="text-muted-foreground text-sm">Enjoy YouTube audio without video</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Hidden YouTube Player */}
        <div id="youtube-player" style={{ display: 'none' }} />
      </div>
    </div>
  );
}