import { material } from '../design/tokens';

const NAMES = ['grass', 'paving', 'gravel', 'bed', 'house'] as const;
type RawPattern = { size: number[]; svg: string; transform?: string };

export function Patterns() {
  return (
    <defs>
      {NAMES.map((k) => {
        const p = material[k].pattern as RawPattern;
        return (
          <pattern
            key={k}
            id={`pat-${k}`}
            patternUnits="userSpaceOnUse"
            width={p.size[0]}
            height={p.size[1]}
            patternTransform={p.transform}
            // Treść wzoru pochodzi z design/tokens.json (statyczne dane projektu), nie od użytkownika.
            dangerouslySetInnerHTML={{ __html: p.svg }}
          />
        );
      })}
    </defs>
  );
}
