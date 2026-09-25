import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/auth/AuthScreen';
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
import { AdminPanelModal } from './components/modals/AdminPanelModal';
import { FloatingAudioIcon } from './components/player/FloatingAudioIcon';

const MainLayout: React.FC = () => {
  const { currentView } = useVideoLibrary();
  const { currentVideo, isMaximized } = useVideoPlayer();

  // Modals state
  const [isAddYouTubeModalOpen, setIsAddYouTubeModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isCreateCollectionOpen, setIsCreateCollectionOpen] = useState(false);
  const [isPlaylistsModalOpen, setIsPlaylistsModalOpen] = useState(false);
  const [isPocketModeOpen, setIsPocketModeOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isPlayStoreModalOpen, setIsPlayStoreModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [saveToCollectionVideoId, setSaveToCollectionVideoId] = useState<string | null>(null);

  const handleOpenCollectionModal = (videoId: string) => {
    setSaveToCollectionVideoId(videoId);
  };

  return (
    <div className="flex flex-col h-[100dvh] w-screen bg-[#0f0d14] text-white overflow-hidden select-none font-sans">
      {/* Top Universal Navbar - Hidden in Maximized Screen Mode */}
      {!isMaximized && (
        <TopNav
          onOpenAddModal={() => setIsAddYouTubeModalOpen(true)}
          onOpenSyncModal={() => setIsSyncModalOpen(true)}
          onOpenPlaylistsModal={() => setIsPlaylistsModalOpen(true)}
          onOpenGuideModal={() => setIsGuideModalOpen(true)}
          onOpenPlayStoreModal={() => setIsPlayStoreModalOpen(true)}
          onOpenAdminModal={() => setIsAdminModalOpen(true)}
        />
      )}

      {/* Main Layout Area: Sidebar (Desktop) + Active View */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Desktop Sidebar - Hidden in Maximized Screen Mode */}
        {!isMaximized && (
          <Sidebar
            onCreateCollectionModal={() => setIsCreateCollectionOpen(true)}
            onOpenAddModal={() => setIsAddYouTubeModalOpen(true)}
            onOpenPlayStoreModal={() => setIsPlayStoreModalOpen(true)}
            onOpenAdminModal={() => setIsAdminModalOpen(true)}
          />
        )}

        {/* View Router */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#0c0a12] overflow-hidden relative">
          {/* Active Browsing Views (Home, Manage, Liked, History, Collection) */}
          <div
            className={`flex-1 flex flex-col min-w-0 overflow-hidden ${
              currentView === 'watch' ? 'hidden' : 'flex'
            }`}
          >
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
          </div>

          {/* Persistent Watch View / Player: NEVER UNMOUNTS once a video is playing, so clip continues uninterrupted */}
          {currentVideo && (
            <div
              className={`absolute inset-0 z-20 flex flex-col overflow-hidden bg-[#0c0a12] transition-opacity duration-150 ${
                currentView === 'watch'
                  ? 'opacity-100 pointer-events-auto'
                  : 'opacity-0 pointer-events-none -z-10'
              }`}
            >
              <WatchView
                onOpenCollectionModal={handleOpenCollectionModal}
                onOpenPocketMode={() => setIsPocketModeOpen(true)}
                onOpenGuideModal={() => setIsGuideModalOpen(true)}
              />
            </div>
          )}
        </main>
      </div>

      {/* Floating Audio Icon with Explodir Button & Pocket Mode - Hidden in Maximized Screen Mode */}
      {!isMaximized && (
        <FloatingAudioIcon
          isPocketMode={isPocketModeOpen}
          onOpenPocketMode={() => setIsPocketModeOpen(true)}
        />
      )}

      {/* Mobile Bottom Navigation - Hidden in Maximized Screen Mode */}
      {!isMaximized && (
        <MobileBottomNav
          onOpenAddModal={() => setIsAddYouTubeModalOpen(true)}
          onOpenPlaylistsModal={() => setIsPlaylistsModalOpen(true)}
          onOpenAdminModal={() => setIsAdminModalOpen(true)}
        />
      )}

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

      {/* Admin Management Modal (Accessible only to Admin) */}
      <AdminPanelModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />
    </div>
  );
};

const AuthenticatedApp: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-screen bg-[#0a0812] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-violet-500/20 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <VideoPlayerProvider>
      <VideoLibraryProvider>
        <MainLayout />
      </VideoLibraryProvider>
    </VideoPlayerProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}
