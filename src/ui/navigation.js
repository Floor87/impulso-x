export function activateTab({ tabName, tabs, panels }) {
  tabs.forEach((tab) => {
    const isActive = tab.dataset.tab === tabName;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
  });
  panels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === tabName);
  });
}

export function bindTabNavigation({ tabs, onActivate }) {
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => onActivate(tab.dataset.tab));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();

      const tabList = [...tabs];
      const currentIndex = tabList.indexOf(tab);
      let nextIndex = currentIndex;
      if (event.key === "ArrowLeft") {
        nextIndex = (currentIndex - 1 + tabList.length) % tabList.length;
      }
      if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabList.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = tabList.length - 1;

      onActivate(tabList[nextIndex].dataset.tab);
      tabList[nextIndex].focus();
    });
  });
}
