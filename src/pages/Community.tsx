import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import PageTransition from '@/components/PageTransition';
import Feed from './Community/Feed';
import InvestmentGroups from './Community/InvestmentGroups';
import Challenges from './Community/Challenges';
import SuccessStories from './Community/SuccessStories';

type TabType = 'feed' | 'groups' | 'challenges' | 'stories';

export default function Community() {
  const [activeTab, setActiveTab] = useState<TabType>('feed');

  return (
    <PageTransition className="space-y-8 pb-20 relative">
      {/* Header and Menu Selection */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-indigo-600" />
            Comunidade VukaPay
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Conecte-se, aprenda e cresça junto com outros investidores angolanos.</p>
        </div>

        <div className="flex bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-gray-150 dark:border-slate-800 p-1.5 rounded-2xl shadow-sm self-start overflow-x-auto w-full xl:w-auto">
          {(['feed', 'groups', 'challenges', 'stories'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-bold transition-all capitalize whitespace-nowrap",
                activeTab === tab 
                  ? "bg-gray-900 dark:bg-indigo-600 text-white shadow-md" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800"
              )}
            >
              {tab === 'feed' ? 'Fórum & Feed' : 
               tab === 'groups' ? 'Grupos de Investimento' : 
               tab === 'challenges' ? 'Desafios' : 'Histórias de Sucesso'}
            </button>
          ))}
        </div>
      </div>

      {/* Render Active Tab */}
      <div className="mt-8">
        {activeTab === 'feed' && <Feed />}
        {activeTab === 'groups' && <InvestmentGroups />}
        {activeTab === 'challenges' && <Challenges />}
        {activeTab === 'stories' && <SuccessStories />}
      </div>
    </PageTransition>
  );
}
