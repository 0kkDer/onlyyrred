// Replace these values with your profile and real stats.
const CREATOR = {
  name: 'yrred',
  handle: '@onlyyrred',
  bio: "Videos, stories, and whatever I'm into. Glad you're here.",
  location: 'Jakarta, Indonesia',
  email: 'hello@example.com',
  channels: [
    {
      name: 'YouTube',
      handle: '@onlyyrred',
      url: 'https://youtube.com/@onlyyrred',
      icon: 'https://cdn.simpleicons.org/youtube/FF0033',
      metrics: [
        { value: '42.8K', label: 'SUBSCRIBERS' },
        { value: '1.2M', label: 'TOTAL VIEWS' },
        { value: '128', label: 'VIDEOS' },
      ],
    },
    {
      name: 'TikTok',
      handle: '@onlyyrred',
      url: 'https://tiktok.com/@onlyyrred',
      icon: 'https://cdn.simpleicons.org/tiktok/20231F',
      metrics: [
        { value: '6.4K', label: 'FOLLOWERS' },
        { value: '66.3K', label: 'LIKES' },
        { value: '6', label: 'VIDEOS' },
      ],
    },
    {
      name: 'Instagram',
      handle: '@onlyyrred',
      url: 'https://instagram.com/onlyyrred',
      icon: 'https://cdn.simpleicons.org/instagram/E4405F',
      metrics: [
        { value: '3K', label: 'FOLLOWERS' },
        { value: '3', label: 'POSTS' },
        { value: '375', label: 'AVG. LIKES' },
      ],
    },
    {
      name: 'Discord',
      handle: 'COMMUNITY SERVER',
      url: 'https://discord.gg/WA2g5g96k5',
      icon: 'https://cdn.simpleicons.org/discord/5865F2',
      action: 'JOIN',
      metrics: [
        { value: '68', label: 'MEMBERS' },
        { value: '65', label: 'MOST ONLINE' },
        { value: '14', label: 'BOOSTS' },
      ],
    },
  ],
};

const nameParts = CREATOR.name.trim().split(/\s+/);
document.querySelector('#creator-name').innerHTML = nameParts.length > 1
  ? `${nameParts[0]}<br><span>${nameParts.slice(1).join(' ')}<span class="period">.</span></span>`
  : `${nameParts[0]}<span class="period">.</span>`;
document.querySelector('#creator-handle').textContent = CREATOR.handle;
document.querySelector('#creator-bio').textContent = CREATOR.bio;
document.querySelector('#creator-location').textContent = CREATOR.location;
document.querySelector('#contact-link').href = `mailto:${CREATOR.email}`;
document.querySelector('#channel-list').innerHTML = CREATOR.channels.map((channel, index) => `
  <article class="channel-row" data-channel="${channel.name.toLowerCase()}" style="--row-delay:${index * 100}ms">
    <div class="platform-identity">
      <span class="platform-logo"><img src="${channel.icon}" alt="" loading="lazy"></span>
      <span><span class="platform-name">${channel.name}</span><span class="platform-handle">${channel.handle}</span></span>
    </div>
    <div class="channel-metrics">${channel.metrics.map((metric) => `<div class="metric"><span class="metric-value">${metric.value}</span><span class="metric-label">${metric.label}</span></div>`).join('')}</div>
    <a class="channel-cta" href="${channel.url}" target="_blank" rel="noopener noreferrer" aria-label="${channel.action === 'JOIN' ? 'Join' : 'Open'} ${channel.name}">${channel.action || 'OPEN'} <span aria-hidden="true">↗</span></a>
  </article>
`).join('');

const revealElements = document.querySelectorAll('.section-heading, .channel-row, .footer');
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  revealElements.forEach((element) => {
    element.classList.add('scroll-reveal');
    revealObserver.observe(element);
  });
} else {
  revealElements.forEach((element) => element.classList.add('is-visible'));
}

const compactNumber = (value) => new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
}).format(Number(value));

function setCreatorAvatar(url) {
  if (!url) return;
  const avatar = document.querySelector('#creator-avatar');
  const image = document.querySelector('#creator-avatar-image');

  image.onload = () => {
    avatar.classList.add('has-image');
  };
  image.onerror = () => avatar.classList.remove('has-image');
  image.src = url;
}

function showLatestCard(platform, content) {
  if (!content) return;
  const card = document.querySelector(`#latest-${platform}-card`);
  const shouldEnter = card.hidden;
  const image = document.querySelector(`#latest-${platform}-image`);
  const title = document.querySelector(`#latest-${platform}-title`);
  const date = document.querySelector(`#latest-${platform}-date`);
  card.href = content.url;
  title.textContent = content.title;
  date.dateTime = content.publishedAt || content.createdAt || '';
  date.textContent = date.dateTime
    ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(date.dateTime))
    : '';
  image.onload = () => card.classList.add('has-thumbnail');
  image.onerror = () => card.classList.remove('has-thumbnail');
  if (content.thumbnailUrl) {
    card.classList.add('has-thumbnail');
    image.src = content.thumbnailUrl;
  }
  if (shouldEnter) card.classList.add('is-entering');
  card.hidden = false;
  document.querySelector('#latest-section').hidden = false;
}

async function refreshYoutubeStats() {
  try {
    const response = await fetch('./youtube-stats.json', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'YouTube stats are unavailable.');

    const youtubeRow = document.querySelector('[data-channel="youtube"]');
    const metricValues = youtubeRow.querySelectorAll('.metric-value');
    const metricLabels = youtubeRow.querySelectorAll('.metric-label');
    metricValues[0].textContent = compactNumber(data.subscribers);
    metricValues[1].textContent = compactNumber(data.views);
    metricValues[2].textContent = compactNumber(data.videos);
    metricLabels[1].textContent = 'TOTAL VIEWS';
    document.querySelector('#youtube-subscriber-count').textContent = compactNumber(data.subscribers);
    document.querySelector('#youtube-total-views').textContent = compactNumber(data.views);
    document.querySelector('#youtube-video-count').textContent = compactNumber(data.videos);
    document.querySelector('#signal-period').textContent = `UPDATED · ${new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(data.updatedAt))}`;
    document.querySelector('#signal-period').classList.add('is-live');
    document.querySelector('#stats-state').textContent = 'YOUTUBE UPDATED';
    setCreatorAvatar(data.profileImage);
    showLatestCard('upload', data.latestUpload);

  } catch {
    document.querySelector('#stats-state').textContent = 'YOUTUBE OFFLINE';
    document.querySelector('#signal-period').classList.remove('is-live');
    document.querySelector('#signal-period').textContent = 'STATS UNAVAILABLE';
  }
}

refreshYoutubeStats();
window.setInterval(refreshYoutubeStats, 5 * 60 * 1000);
