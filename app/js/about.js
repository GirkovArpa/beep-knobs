import { $, $$ } from '@sciter';
import { launch } from '@env';
import { cwd } from '@sys';

$('#sciter').on('click', () => {
  launch('https://sciter.com');
});

$('#terra-informatica').on('click', () => {
  launch('https://terrainformatica.com');
});

$('#girkov-arpa').on('click', () => {
  launch('https://github.com/girkovarpa/');
});

$('button').on('click', () => Window.this.close());