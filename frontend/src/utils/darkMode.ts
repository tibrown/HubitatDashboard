export function initDarkMode(): void {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const stored = localStorage.getItem('darkMode')
  if (stored === 'true' || (stored === null && prefersDark)) {
    document.documentElement.classList.add('dark')
  }
}

export function toggleDarkMode(): void {
  const html = document.documentElement
  const isDark = html.classList.toggle('dark')
  localStorage.setItem('darkMode', String(isDark))
}

export function isDarkMode(): boolean {
  return document.documentElement.classList.contains('dark')
}
