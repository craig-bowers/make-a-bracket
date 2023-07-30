(() => {
  const search = new URL(document.currentScript.src).search.substring(1);
  const stringPreparation = decodeURI(search)
    .replace(/"/g, '\\"')
    .replace(/&/g, '","')
    .replace(/=/g, '":"');
  const qs = JSON.parse('{"' + stringPreparation + '"}');

  let origin;
  if (document.currentScript.src.startsWith('http://localhost:3000')) {
    // Set the iframe src for local development
    origin = 'http://localhost:3000';
  } else if (
    document.currentScript.src
      .toLowerCase()
      .startsWith('https://makeabracket.com')
  ) {
    // Set the iframe src for production
    origin = 'https://makeabracket.com';
  } else {
    return;
  }

  let container = document.querySelector(`#bracket-embed-${qs.id}`);
  container.style.display = 'flex';

  let script = document.createElement('script');
  script.src =
    'https://cdnjs.cloudflare.com/ajax/libs/iframe-resizer/4.3.6/iframeResizer.min.js';
  document.head.appendChild(script);

  let iframe = document.createElement('iframe');
  iframe.id = `bracket-iframe-${qs.id}`;
  iframe.src = `${origin}/embed/bracket/${qs.id}`;
  iframe.style.width = '1px';
  iframe.style.minWidth = '100%';
  iframe.style.border = 'none';

  container.appendChild(iframe);

  script.onload = () => {
    iframe.onload = () => {
      iFrameResize(
        {
          // log: true,
          scrolling: 'yes',
        },
        `#bracket-iframe-${qs.id}`
      );
    };
  };
})();
