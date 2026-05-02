import { amber, sand, slate, tomato } from "@radix-ui/colors";

export function applyRadixTheme() {
  const root = document.documentElement;

  root.style.setProperty("--sand-1", sand.sand1);
  root.style.setProperty("--sand-3", sand.sand3);
  root.style.setProperty("--sand-5", sand.sand5);
  root.style.setProperty("--sand-7", sand.sand7);
  root.style.setProperty("--sand-11", sand.sand11);
  root.style.setProperty("--sand-12", sand.sand12);

  root.style.setProperty("--amber-3", amber.amber3);
  root.style.setProperty("--amber-7", amber.amber7);
  root.style.setProperty("--amber-11", amber.amber11);
  root.style.setProperty("--amber-12", amber.amber12);

  root.style.setProperty("--slate-11", slate.slate11);
  root.style.setProperty("--slate-12", slate.slate12);

  root.style.setProperty("--tomato-3", tomato.tomato3);
  root.style.setProperty("--tomato-7", tomato.tomato7);
  root.style.setProperty("--tomato-11", tomato.tomato11);
}
