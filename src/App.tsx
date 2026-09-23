import React, { useState } from 'react';
import { VideoPlayerProvider, useVideoPlayer } from './context/VideoPlayerContext';
import { VideoLibraryProvider, useVideoLibrary } from './context/VideoLibraryContext';
import { TopNav } from './components/TopNav';
import { Sidebar } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { HomeView } from './components/views/HomeView';
import { WatchView } from './components/views/WatchView';
import { ManageLibraryView } from './components/views/ManageLibraryView';
import { LikedView } from './components/views/LikedView';
import { HistoryView } from './components/views/HistoryView';
import { CollectionView } from './components/views/CollectionView';
import { AddYouTubeModal } from './components/modals/AddYouTubeModal';
import { SyncSettingsModal } from './components/modals/SyncSettingsModal';
import { SaveToCollectionModal } from './components/modals/SaveToCollectionModal';
import { CreateCollectionModal } from './components/modals/CreateCollectionModal';
import { PlaylistsDropdownModal } from './components/modals/PlaylistsDropdownModal';
import { PocketModeOverlay } from './components/player/PocketModeOverlay';
import { BackgroundPlayGuideModal } from './components/modals/BackgroundPlayGuideModal';
import { PlayStoreModal } from './components/modals/PlayStoreModal';
import { FloatingAudioIcon } from './components/player/FloatingAudioIcon';

const MainLayout: React.FC = () => {
  const { currentView } = useVideoLibrary();
  const { currentVideo } = useVideoPlayer();

  // Modals state
  const [isAddYouTubeModalOpen, setIsAddYouTubeModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isCreateCollectionOpen, setIsCreateCollectionOpen] = useState(false);
  const [isPlaylistsModalOpen, setIsPlaylistsModalOpen] = useState(false);
  const [isPocketModeOpen, setIsPocketModeOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isPlayStoreModalOpen, setIsPlayStoreModalOpen] = useState(false);
  const [saveToCollectionVideoId, setSaveToCollectionVideoId] = useState<string | null>(null);

  const handleOpenCollectionModal = (videoId: string) => {
    setSaveToCollectionVideoId(videoId);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#121212] text-white overflow-hidden select-none font-sans">
      {/* Top Universal Navbar */}
      <TopNav
        onOpenAddModal={() => setIsAddYouTubeModalOpen(true)}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenPlaylistsModal={() => setIsPlaylistsModalOpen(true)}
        onOpenGuideModal={() => setIsGuideModalOpen(true)}
        onOpenPlayStoreModal={() => setIsPlayStoreModalOpen(true)}
      />

      {/* Main Layout Area: Sidebar (Desktop) + Active View */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Desktop Sidebar */}
        <Sidebar
          onCreateCollectionModal={() => setIsCreateCollectionOpen(true)}
          onOpenAddModal={() => setIsAddYouTubeModalOpen(true)}
          onOpenSyncModal={() => setIsSyncModalOpen(true)}
          onOpenPlayStoreModal={() => setIsPlayStoreModalOpen(true)}
        />

        {/* Dynamic Main View */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#121212] overflow-hidden relative">
          {/* WatchView is kept mounted when currentVideo exists so audio NEVER restarts or interrupts when navigating! */}
          {currentVideo && (
            <div
              className={
                currentView === 'watch'
                  ? 'flex-1 flex flex-col min-w-0 overflow-y-auto'
                  : 'fixed -top-[9999px] -left-[9999px] w-[1px] h-[1px] opacity-0 pointer-events-none overflow-hidden z-[-1]'
              }
            >
              <WatchView
                onOpenCollectionModal={handleOpenCollectionModal}
                onOpenPocketMode={() => setIsPocketModeOpen(true)}
                onOpenGuideModal={() => setIsGuideModalOpen(true)}
              />
            </div>
          )}

          {/* Visible View when not on 'watch' */}
          {currentView !== 'watch' && (
            <>
              {currentView === 'home' && (
                <HomeView
                  onOpenAddModal={() => setIsAddYouTubeModalOpen(true)}
                  onOpenSyncModal={() => setIsSyncModalOpen(true)}
                  onOpenCollectionModal={handleOpenCollectionModal}
                />
              )}

              {currentView === 'manage' && (
                <ManageLibraryView
                  onOpenAddModal={() => setIsAddYouTubeModalOpen(true)}
                  onOpenSyncModal={() => setIsSyncModalOpen(true)}
                  onOpenCollectionModal={handleOpenCollectionModal}
                />
              )}

              {currentView === 'liked' && (
                <LikedView onOpenCollectionModal={handleOpenCollectionModal} />
              )}

              {currentView === 'history' && (
                <HistoryView onOpenCollectionModal={handleOpenCollectionModal} />
              )}

              {currentView === 'collection' && (
                <CollectionView onOpenCollectionModal={handleOpenCollectionModal} />
              )}
            </>
          )}
        </main>
      </div>

      {/* Floating Audio Icon with Explodir Button & Pocket Mode (No image/video blocking the screen!) */}
      <FloatingAudioIcon
        isPocketMode={isPocketModeOpen}
        onOpenPocketMode={() => setIsPocketModeOpen(true)}
      />

      {/* Mobile Bottom Navigation (Spotify style) */}
      <MobileBottomNav
        onOpenAddModal={() => setIsAddYouTubeModalOpen(true)}
        onOpenPlaylistsModal={() => setIsPlaylistsModalOpen(true)}
      />

      {/* Pocket Mode / Tela 100% Apagada (Ouvir no Bolso sem toques acidentais e zero gasto de bateria) */}
      <PocketModeOverlay
        isOpen={isPocketModeOpen}
        onClose={() => setIsPocketModeOpen(false)}
      />

      {/* Guide Modal: Dicas para ouvir com celular bloqueado */}
      <BackgroundPlayGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        onOpenPocketMode={() => setIsPocketModeOpen(true)}
      />

      {/* Playlists Dropdown / Bottom Sheet Modal */}
      <PlaylistsDropdownModal
        isOpen={isPlaylistsModalOpen}
        onClose={() => setIsPlaylistsModalOpen(false)}
        onOpenCreatePlaylist={() => setIsCreateCollectionOpen(true)}
      />

      {/* Play Store & PWA Install Guide Modal */}
      <PlayStoreModal
        isOpen={isPlayStoreModalOpen}
        onClose={() => setIsPlayStoreModalOpen(false)}
      />

      {/* Modals */}
      <AddYouTubeModal
        isOpen={isAddYouTubeModalOpen}
        onClose={() => setIsAddYouTubeModalOpen(false)}
      />

      <SyncSettingsModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />

      <SaveToCollectionModal
        isOpen={Boolean(saveToCollectionVideoId)}
        videoId={saveToCollectionVideoId}
        onClose={() => setSaveToCollectionVideoId(null)}
        onOpenCreateCollection={() => setIsCreateCollectionOpen(true)}
      />

      <CreateCollectionModal
        isOpen={isCreateCollectionOpen}
        onClose={() => setIsCreateCollectionOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <VideoLibraryProvider>
      <VideoPlayerProvider>
        <MainLayout />
      </VideoPlayerProvider>
    </VideoLibraryProvider>
  );
}
