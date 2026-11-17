const noticeModal = document.getElementById('noticeModal');
const noticeDismiss = document.getElementById('noticeDismiss');

function dismissNotice() {
  noticeModal.classList.add('is-dismissed');
}

noticeDismiss.addEventListener('click', dismissNotice);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !noticeModal.classList.contains('is-dismissed')) {
    dismissNotice();
  }
});
