function showNotification(title: string, message: string, type: 'info' | 'success' | 'warning' = 'info', duration = 4000) {
  const notification = document.createElement('div');
  const bgColor = type === 'info' ? '#2563eb' : type === 'success' ? '#16a34a' : '#d97706';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${bgColor};
    color: white;
    padding: 16px 20px;
    border-radius: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    max-width: 350px;
    z-index: 2147483647;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.2);
    animation: slideInNotification 0.3s ease-out;
  `;

  const titleEl = document.createElement('div');
  titleEl.style.cssText = 'font-weight: 600; margin-bottom: 8px; font-size: 15px;';
  titleEl.textContent = title;

  const messageEl = document.createElement('div');
  messageEl.style.cssText = 'line-height: 1.4; white-space: pre-line; opacity: 0.9;';
  messageEl.textContent = message;

  notification.appendChild(titleEl);
  notification.appendChild(messageEl);

  if (!document.getElementById('notification-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'notification-styles';
    styleSheet.textContent = `@keyframes slideInNotification { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`;
    document.head.appendChild(styleSheet);
  }

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, duration);
}

function createNotification(title: string, message: string, type: 'info' | 'success' | 'warning' = 'info'): HTMLElement {
  const notification = document.createElement('div')
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'info' ? '#2563eb' : type === 'success' ? '#16a34a' : '#d97706'};
    color: white;
    padding: 16px 20px;
    border-radius: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    max-width: 350px;
    z-index: 2147483647;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.2);
    animation: slideInNotification 0.3s ease-out;
  `
  
  const titleEl = document.createElement('div')
  titleEl.style.cssText = 'font-weight: 600; margin-bottom: 8px; font-size: 15px;'
  titleEl.textContent = title
  
  const messageEl = document.createElement('div')
  messageEl.style.cssText = 'line-height: 1.4; white-space: pre-line; opacity: 0.9;'
  messageEl.textContent = message
  
  notification.appendChild(titleEl)
  notification.appendChild(messageEl)
  
  // Add animation styles if not already present
  if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style')
    style.id = 'notification-styles'
    style.textContent = `
      @keyframes slideInNotification {
        from { 
          transform: translateX(100%) scale(0.9); 
          opacity: 0; 
        }
        to { 
          transform: translateX(0) scale(1); 
          opacity: 1; 
        }
      }
    `
    document.head.appendChild(style)
  }
  
  document.body.appendChild(notification)
  return notification
}