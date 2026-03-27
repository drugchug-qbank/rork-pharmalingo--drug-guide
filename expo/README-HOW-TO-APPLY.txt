PharmaLingo UI Update (Clean Overwrite)

If your app is crashing with an error like:
  Unexpected token <<<<<<< HEAD

That means your repo has Git merge-conflict markers inside a .tsx file.

FASTEST FIX:
1) Unzip this file.
2) Copy the included 'app' and 'components' folders into the ROOT of your repo.
   - The same place your existing app/ folder lives.
3) Choose "Replace / Overwrite" when prompted.

If you still see the error:
- Search your project for these strings and remove them:
  <<<<<<<
  =======
  >>>>>>>

If you have a terminal in the repo root, you can verify no merge markers remain:
  grep -R "<<<<<<<" -n app components

(Should return nothing.)
