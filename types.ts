export enum VoiceName {
  Zephyr = 'Zephyr',
  Puck = 'Puck',
  Charon = 'Charon',
  Kore = 'Kore',
  Fenrir = 'Fenrir',
  Leda = 'Leda',
  Orus = 'Orus',
  Aoede = 'Aoede',
  Callirrhoe = 'Callirrhoe',
  Autonoe = 'Autonoe',
  Enceladus = 'Enceladus',
  Iapetus = 'Iapetus',
  Umbriel = 'Umbriel',
  Algieba = 'Algieba',
  Despina = 'Despina',
  Erinome = 'Erinome',
  Algenib = 'Algenib',
  Rasalgethi = 'Rasalgethi',
  Laomedeia = 'Laomedeia',
  Achernar = 'Achernar',
  Alnilam = 'Alnilam',
  Schedar = 'Schedar',
  Gacrux = 'Gacrux',
  Pulcherrima = 'Pulcherrima',
  Achird = 'Achird',
  Zubenelgenubi = 'Zubenelgenubi',
  Vindemiatrix = 'Vindemiatrix',
  Sadachbia = 'Sadachbia',
  Sadaltager = 'Sadaltager',
  Sulafat = 'Sulafat',
}

export type ReaderMode = 'narrator' | 'speed' | 'news' | 'monotone';

export interface Sentence {
  text: string;
  index: number;
  isParagraphStart?: boolean;
}

export interface AudioCache {
  [index: number]: AudioBuffer;
}

export type PlaybackState = 'idle' | 'buffering' | 'loading' | 'playing' | 'paused';
