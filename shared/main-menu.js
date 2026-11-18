const noticeModal = document.getElementById('noticeModal');
const noticeDismiss = document.getElementById('noticeDismiss');
const noticeSessionKey = 'arcade-copilot-notice-dismissed';

function isNoticeDismissed() {
  try {
    return sessionStorage.getItem(noticeSessionKey) === 'true';
  } catch (error) {
    console.warn('No se pudo leer el estado del aviso:', error);
    return false;
  }
}

function dismissNotice() {
  noticeModal.classList.add('is-dismissed');
  try {
    sessionStorage.setItem(noticeSessionKey, 'true');
  } catch (error) {
    console.warn('No se pudo guardar el estado del aviso:', error);
  }
}

if (isNoticeDismissed()) {
  noticeModal.classList.add('is-dismissed');
} else {
  noticeDismiss.addEventListener('click', dismissNotice);
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !noticeModal.classList.contains('is-dismissed')) {
    dismissNotice();
  }
});
