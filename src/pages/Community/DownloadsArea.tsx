import React from 'react';
import PageTransition from '@/components/PageTransition';
import { Download } from 'lucide-react';

const WindowsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 88 88" fill="currentColor" {...props}>
    <path d="M0,12.402l35.687-4.86l0,34.423l-35.687,0l0,-29.563Zm0,33.023l35.687,0l0,33.623l-35.687,-5.006l0,-28.617Zm39.638,-38.307l48.362,-6.815l0,40.165l-48.362,0l0,-33.35Zm0,36.565l48.362,0l0,39.387l-48.362,-6.992l0,-32.395Z" />
  </svg>
);

const AppleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 170 170" fill="currentColor" {...props}>
    <path d="M150.37,130.25c-2.45,5.66-5.35,10.87-8.71,15.66-4.58,6.53-8.33,11.05-11.22,13.56-4.48,4.12-9.28,6.23-14.42,6.35-3.69,0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58,0-9.49,1.05-14.75,3.17-5.26,2.13-9.5,3.24-12.74,3.35-4.92,0.21-9.84-1.96-14.74-6.53-3.13-2.73-7.1-7.43-11.87-14.09-5.02-7.06-9.47-15.35-13.36-24.89-3.88-9.54-5.83-19.12-5.83-28.74,0-13.88,3.5-24.87,10.51-32.96,5.32-6.14,11.75-9.67,19.29-10.6,3.61-0.34,8.15,0.76,13.62,3.31,5.47,2.56,9.59,3.84,12.35,3.84,2.2,0,6.6-1.39,13.2-4.18,6.6-2.78,11.85-3.92,15.77-3.41,10.38,1.4,18.42,5.65,24.11,12.75-9.76,5.7-14.49,13.88-14.19,24.53,0.3,10.62,4.8,19.06,13.48,25.32-1.93,5.5-4.22,10.52-6.86,15.06Zm-30.82-108.97c-0.12,6.54-2.58,12.38-7.39,17.51-4.81,5.13-10.64,8.08-17.51,8.83-0.54-6.26,1.83-12.18,7.12-17.76,5.29-5.58,11.12-8.54,17.51-8.91,0.06,0.11,0.16,0.22,0.27,0.33Z" />
  </svg>
);

const LinuxIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 100 100" fill="currentColor" {...props}>
    <path d="M49.998,0C22.387,0 0,22.388 0,50C0,77.613 22.387,100 49.998,100C77.613,100 100,77.613 100,50C100,22.388 77.613,0 49.998,0ZM82.262,71.011C80.378,74.542 77.868,77.72 74.836,80.407L63.504,60.781C65.556,59.597 67.319,57.945 68.618,55.938L82.262,71.011ZM68.497,44.207C66.126,48.314 62.146,51.055 57.653,51.849L69.05,71.587C64.316,73.847 59.083,75.051 53.687,75.051C47.88,75.051 42.316,73.666 37.331,71.161L48.65,51.564C44.156,50.771 40.176,48.029 37.805,43.921C35.436,39.814 35.031,34.981 36.705,30.592C40.672,27.11 45.881,24.949 51.563,24.949C57.48,24.949 62.885,27.272 66.89,30.957C68.658,35.318 68.441,40.134 68.497,44.207ZM23.465,65.867L37.108,50.793C38.406,52.8 40.169,54.453 42.221,55.637L30.889,75.263C27.857,72.576 25.347,69.398 23.465,65.867ZM41.053,30.938C39.068,34.376 39.068,38.563 41.053,42.001C43.037,45.439 46.73,47.531 50.701,47.531C54.671,47.531 58.365,45.439 60.349,42.001C62.334,38.563 62.334,34.376 60.349,30.938C58.365,27.499 54.671,25.408 50.701,25.408C46.73,25.408 43.037,27.499 41.053,30.938Z" />
  </svg>
);

const AndroidIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 250 250" fill="currentColor" {...props}>
    <path d="M174.45,86.29l17.75-30.73c0.97-1.68 0.4-3.83-1.28-4.8-1.68-0.97-3.83-0.4-4.8,1.28l-18.06,31.28c-12.75-5.78-27.18-9-42.34-9-15.17,0-29.6,3.22-42.34,9l-18.06-31.28c-0.97-1.68-3.12-2.25-4.8-1.28-1.68,0.97-2.25,3.12-1.28,4.8l17.75,30.73c-28.78,15.77-48.42,45.36-50.68,80.12h198.81c-2.25-34.76-21.9-64.35-50.68-80.12Zm-83.39,46.99c-3.95,0-7.16-3.21-7.16-7.16 0-3.95 3.21-7.16 7.16-7.16s7.16,3.21 7.16,7.16c0,3.95-3.21,7.16-7.16,7.16Zm69.3,0c-3.95,0-7.16-3.21-7.16-7.16 0-3.95 3.21-7.16 7.16-7.16s7.16,3.21 7.16,7.16c0,3.95-3.21,7.16-7.16,7.16Z" />
  </svg>
);

export default function DownloadsArea() {
  const latestVersion = '1.1.5';
  const buildDate = '12 Junho 2026';

  const PLATFORMS = [
    {
      name: 'Windows 10 / 11',
      extension: 'Instalador .EXE',
      size: '48.2 MB',
      architecture: 'x64 (64-bit)',
      icon: WindowsIcon,
      color: 'from-blue-500 to-indigo-600',
      tagColor: 'bg-blue-50 text-blue-700',
      downloadUrl: '#download-windows-exe'
    },
    {
      name: 'macOS',
      extension: 'Ficheiro .DMG',
      size: '52.6 MB',
      architecture: 'Universal (Apple Silicon M1/M2/M3 & Intel)',
      icon: AppleIcon,
      color: 'from-slate-800 to-slate-950',
      tagColor: 'bg-slate-50 text-slate-700',
      downloadUrl: '#download-mac-dmg'
    },
    {
      name: 'Linux (Ubuntu / Debian)',
      extension: 'Pacote .DEB',
      size: '42.1 MB',
      architecture: 'x64 (64-bit)',
      icon: LinuxIcon,
      color: 'from-orange-500 to-red-600',
      tagColor: 'bg-orange-50 text-orange-700',
      downloadUrl: '#download-linux-deb'
    },
    {
      name: 'Android Mobile',
      extension: 'Ficheiro .APK',
      size: '22.8 MB',
      architecture: 'ARM64-v8a',
      icon: AndroidIcon,
      color: 'from-emerald-500 to-teal-600',
      tagColor: 'bg-emerald-50 text-emerald-700',
      downloadUrl: '#download-android-apk'
    }
  ];

  const triggerDownload = (platformName: string) => {
    // Simula o download mostrando uma mensagem de sucesso premium
    alert(`A iniciar o download do executável VukaPay para ${platformName} (Versão v${latestVersion})...`);
  };

  return (
    <PageTransition className="p-4 lg:p-8 w-full max-w-7xl mx-auto space-y-8">
      
      {/* Banner de Lançamento */}
      <section className="bg-gradient-to-r from-gray-900 via-slate-950 to-gray-900 border border-slate-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg text-left">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-brand-600 text-white rounded-full text-xs font-black uppercase tracking-wider">
              Último Lançamento
            </span>
            <span className="text-gray-400 text-xs font-bold">Compilado em {buildDate}</span>
          </div>
          <h2 className="text-3xl font-black mb-3 tracking-tight">VukaPay Clientes v{latestVersion}</h2>
          <p className="text-sm text-gray-300 leading-relaxed max-w-xl">
            Descarregue a versão nativa e estável da aplicação para qualquer dispositivo. Aceda às suas kixiquilas, orçamentos e contas bancárias com desempenho local máximo e sincronização em nuvem.
          </p>
        </div>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none hidden md:block">
          <Download className="w-40 h-40" />
        </div>
      </section>

      {/* Grid de Plataformas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PLATFORMS.map((plat) => {
          const IconComponent = plat.icon;
          return (
            <div 
              key={plat.name}
              className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-brand-200 hover:shadow-md transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plat.color} flex items-center justify-center text-white shadow-md shrink-0 group-hover:scale-105 transition-transform`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-gray-900 leading-tight">
                    {plat.name}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${plat.tagColor}`}>
                      {plat.extension}
                    </span>
                    <span className="text-xs text-gray-500 font-bold">{plat.size}</span>
                  </div>
                  <p className="text-xs text-gray-400 font-medium pt-1">
                    Arquitetura: {plat.architecture}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-bold">SHA-256 Verificado</span>
                <button 
                  onClick={() => triggerDownload(plat.name)}
                  className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-black text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descarregar
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </PageTransition>
  );
}
