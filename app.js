
document.addEventListener("DOMContentLoaded",function(){
 const tabs=document.querySelectorAll(".tab"), panels=document.querySelectorAll(".panel");
 tabs.forEach(tab=>tab.addEventListener("click",()=>{
   tabs.forEach(t=>t.classList.remove("active"));
   panels.forEach(p=>p.classList.remove("active"));
   tab.classList.add("active");
   document.getElementById(tab.dataset.tab).classList.add("active");
 }));
 const menu=document.querySelector(".menu"),nav=document.querySelector("nav");
 if(menu)menu.addEventListener("click",()=>{
   nav.style.display=nav.style.display==="flex"?"none":"flex";
   nav.style.position="absolute";nav.style.right="4%";nav.style.top="65px";
   nav.style.background="rgba(6,30,45,.98)";nav.style.padding="18px";
   nav.style.borderRadius="16px";nav.style.flexDirection="column";nav.style.alignItems="stretch";
 });
});

/* Responsive hero video switching: landscape video on desktop/tablet,
   portrait video on mobile. Only the active video is played. */
(() => {
  const desktopVideo = document.querySelector(".hero-video-desktop");
  const mobileVideo = document.querySelector(".hero-video-mobile");
  if (!desktopVideo || !mobileVideo) return;

  const mobileQuery = window.matchMedia("(max-width: 767px)");

  function setActiveHeroVideo() {
    const useMobile = mobileQuery.matches;
    const active = useMobile ? mobileVideo : desktopVideo;
    const inactive = useMobile ? desktopVideo : mobileVideo;

    inactive.pause();
    inactive.removeAttribute("autoplay");
    active.setAttribute("autoplay", "");
    active.muted = true;
    active.setAttribute("muted", "");
    active.setAttribute("playsinline", "");

    const playPromise = active.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  }

  setActiveHeroVideo();

  if (mobileQuery.addEventListener) {
    mobileQuery.addEventListener("change", setActiveHeroVideo);
  } else {
    mobileQuery.addListener(setActiveHeroVideo);
  }

  window.addEventListener("orientationchange", setActiveHeroVideo, { passive: true });
})();
