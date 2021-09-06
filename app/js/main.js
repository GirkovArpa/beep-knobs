import { $, $$ } from '@sciter';
import moveableView from 'moveable-view.js';

Window.this.on('~statechange', function () {
  if (Window.this.state === Window.WINDOW_MAXIMIZED) {
    document.style.border = 'window-frame-width solid black';
    $('[role="window-maximize"]').innerHTML = '&#128471;';
  } else {
    document.style.border = 'none';
    $('[role="window-maximize"]').textContent = '🗖';
  }
});

moveableView('window-caption');
initKnob('#knob-frequency', 3);
initKnob('#knob-duration', 33);
initKnob('#knob-volume', 1);
adjustWindow();
$('[role="window-help"]').on('click', showAbout);
document.addEventListener('keyup', ({ code }) => {
  if (code === 'KeyF1') {
    showAbout();
  }
});
$('#play').on('click', async () => {
  await beep(
    $('#volume').value,
    $('#frequency').value.replace('hz', ''),
    $('#duration').value.replace('ms', '')
  );
});

function showAbout() {
  Window.this.modal({
    url: '../about.html'
  });
}

$('window-caption').on('dblclick', function () {
  $('[role="window-maximize"]').click();
});

function beep(volume, frequency, duration) {
  volume = volume.replace(/[^\d\.]/g, '');
  volume = Number(volume);
  frequency = frequency.replace(/[^\d\.]/g, '');
  frequency = Number(frequency);
  duration = duration.replace(/[^\d\.]/g, '');
  duration = Number(duration);
  duration = Number(duration) / 1_000;
  return new Promise((resolve) => {
    Window.this.xcall(
      'beep',
      volume,
      frequency,
      duration,
      resolve
    );
  });
}


function adjustWindow() {
  const [wmin] = document.state.contentWidths();
  const w = wmin + 50;
  const h = document.state.contentHeight(w) + 50;
  const [sw, sh] = Window.this.screenBox('frame', 'dimension');
  Window.this.move((sw - w) / 2, (sh - h) / 2, w, h, true);
}

function clampPercentage(percentage) {
  if (percentage < 0) return 0;
  if (percentage > 100) return 100;
  return percentage;
}

function initKnob(selector, percentage) {
  const knob = $(`${selector} .knob`);
  updateKnob(selector, percentage);

  knob.on('mousewheel', function (evt) {
    if (selector === '#knob-duration') {
      percentage += evt.deltaY > 0 ? -.1 : .1;
    } else {
      percentage += evt.deltaY > 0 ? -1 : 1;
    }
    percentage = clampPercentage(percentage);
    updateKnob(selector, percentage);
  });

  knob.on('mouseenter', function () {
    knob.classList.add('hover');
  });

  knob.on('mouseleave', function () {
    if (!dragging) {
      knob.classList.remove('hover');
    }
  });

  let dragging = false;

  knob.on('click', function () {
    if (dragging) {
      dragging = false;
      $('body').classList.remove('dragging');
      $('body').state.capture(false);
      knob.classList.remove('active');
      knob.classList.remove('hover');
    }
  });


  knob.on('mousedown', function () {
    dragging = true;
    $('body').classList.add('dragging');
    $('body').state.capture(true);
    knob.classList.add('active');
    knob.classList.add('hover');
  });

  $('body').on('mouseup', function () {
    dragging = false;
    $('body').classList.remove('dragging');
    $('body').state.capture(false);
    knob.classList.remove('active');
    knob.classList.remove('hover');
  });

  let last_x = 0;
  let last_y = 0;
  $('body').on('mousemove', function (evt) {
    const deltaX = evt.x - last_x;
    const deltaY = evt.y - last_y;
    last_x = evt.x;
    last_y = evt.y;
    if (dragging) {
      if (selector === '#knob-duration') {
        percentage += deltaX * .1;
        percentage -= deltaY * .1;
      } else {
        percentage += deltaX;
        percentage -= deltaY;
      }
      percentage = clampPercentage(percentage);
      updateKnob(selector, percentage);
    }
  });
}

function updateKnob(selector, percentage) {
  let unit = '';
  let factor = 1;
  if (selector === '#knob-volume') {
    unit = '';
    factor = .1;
  }
  if (selector === '#knob-duration') {
    unit = 'ms';
    factor = 10;
  }
  if (selector === '#knob-frequency') {
    unit = 'hz';
    factor = 100;
  }
  $(`${selector} input`).value = `${(percentage * factor).toFixed(factor == .1 ? 1 : factor == 10 ? 0 : 0)}${unit}`;
  updateRing(selector, percentage);
  updateDot(selector, percentage);
}

function updateRing(selector, percentage) {
  const circle = $(`${selector} .band > circle`);
  let radius = Number(circle.attributes.r);
  let circumference = Number(radius) * 2 * Math.PI;
  circle.style.strokeDasharray = `${circumference} ${circumference}`;
  let offset = circumference - percentage / 100 * circumference;
  circle.style.strokeDashoffset = offset;
}

function updateDot(selector, percentage) {
  let deg = percentage * 3.6;
  $(`${selector} .dot`).style.transform = `rotate(${deg + 270}deg)`;
}

function waitFor(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}