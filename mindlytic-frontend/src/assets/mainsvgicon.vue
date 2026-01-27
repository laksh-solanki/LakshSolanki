<template>
  <div class="header-brand" @click="$router.push('/')" style="max-width: 153px; height: 100%;">
    <svg width="45" height="45" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gemini-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#4285F4" />
          <stop offset="40%" stop-color="#9b72cb" />
          <stop offset="70%" stop-color="#d96570" />
          <stop offset="100%" stop-color="#f4af42" />
        </linearGradient>

        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <rect x="10" y="10" width="80" height="80" rx="25" fill="#f8f9ff" stroke="#e0e0e0" stroke-width="0.5" />

      <path class="m-body" d="M30 65
                 C30 35, 35 25, 45 25
                 C50 25, 50 45, 50 45
                 C50 45, 50 25, 55 25
                 C65 25, 70 35, 70 65" fill="none" stroke="url(#gemini-grad)" stroke-width="10" stroke-linecap="round"
        filter="url(#glow)" />

      <path class="flare" d="M85 15 C85 18 82 20 80 20 C82 20 85 22 85 25 C85 22 88 20 90 20 C88 20 85 18 85 15Z"
        fill="#9b72cb" />

      <rect x="35" y="75" width="30" height="6" rx="3" fill="#F4C430" opacity="0.8" />
    </svg>
    <h1 class="brand-name">Mind<span class="accent">lytic</span></h1>
  </div>
</template>

<style>
.header-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-family: "Inter", sans-serif;
}

.brand-name {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.4px;
  color: #ffffff;
  margin: 0;
}

.accent {
  color: #6366f1;
}
</style>
