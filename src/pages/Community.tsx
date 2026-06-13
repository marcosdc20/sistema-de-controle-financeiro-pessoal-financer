import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import PageTransition from '@/components/PageTransition';
import Feed from './Community/Feed';
import ChatsManager from './Community/ChatsManager';
import InvestmentGroups from './Community/InvestmentGroups';
import Challenges from './Community/Challenges';
import SuccessStories from './Community/SuccessStories';
import DownloadsArea from './Community/DownloadsArea';

type TabType = 'feed' | 'chats' | 'groups' | 'challenges' | 'stories' | 'downloads';

export default function Community() {
  const [activeTab, setActiveTab] = useState<TabType>('feed');

  return (
    <PageTransition className="space-y-8 pb-20 relative max-w-7xl mx-auto px-4 lg:px-8">
      {/* Header and Menu Selection */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-brand-600" />
            Comunidade VukaPay
          </h1>
          <p className="text-gray-500 mt-1 font-medium">Conecte-se, aprenda e cresça junto com outros investidores angolanos.</p>
        </div>

        <div className="flex bg-white border border-gray-200 p-1.5 rounded-2xl shadow-sm self-start overflow-x-auto w-full xl:w-auto scrollbar-hide">
          {(['feed', 'chats', 'groups', 'challenges', 'stories', 'downloads'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-sm font-bold transition-all capitalize whitespace-nowrap cursor-pointer",
                activeTab === tab 
                  ? "bg-gray-900 text-white shadow-md" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              {tab === 'feed' ? 'Fórum Geral' : 
               tab === 'chats' ? 'Conversas & Círculos' :
               tab === 'groups' ? 'Grupos de Investimento' : 
               tab === 'challenges' ? 'Desafios' : 
               tab === 'stories' ? 'Histórias de Sucesso' : 'Downloads / Executáveis'}
            </button>
          ))}
        </div>
      </div>

      {/* Render Active Tab */}
      <div className="mt-8">
        {activeTab === 'feed' && <Feed />}
        {activeTab === 'chats' && <ChatsManager />}
        {activeTab === 'groups' && <InvestmentGroups />}
        {activeTab === 'challenges' && <Challenges />}
        {activeTab === 'stories' && <SuccessStories />}
        {activeTab === 'downloads' && <DownloadsArea />}
      </div>
    </PageTransition>
  );
}
