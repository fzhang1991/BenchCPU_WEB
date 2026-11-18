
## TBench LaTeX Template

This is the official LaTeX class and template for the journal 'BenchCouncil Transactions on Benchmarks, Standards and Evaluations'(TBench).
## License and Origin

This template is based on the original LaTeX class `mam-authoring-template.cls` created by Peter Jones for the journal *Microscopy and Microanalysis*.

- Original Overleaf project: 
https://www.overleaf.com/latex/templates/microscopy-and-microanalysis-template/ndmcfsytwfbm

- License: [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/)

All modifications are allowed under the CC BY 4.0 license, and appropriate credit is provided.

## Modifications from the Original Template
For the style under the contemporary option, the following changes have been made:

1. Title color: Changed from {\color{jnlclr}\@title} to {\color{black}\@title}.

2. Key words section: Modified the color, font size, and vertical spacing:
from {\fontsize{8bp}{10}\textbf{{Key words}:}
to {\fontsize{10.5pt}{10}\textbf{\color{jnlclr}{Key words}:}.

3. Header rule: Added a horizontal rule below the header on the first page using:
\ifnum\value{page}=1
  \vspace{0.1ex}
  \noindent\textcolor{black!80}{\rule{\textwidth}{1.25pt}}
\fi

4. Header text color: Set to black on both even and odd pages.

5. Page numbering: Moved from the header to the center of the footer on every page.

6. Sample text content: The .tex file includes revisions to sample text content and reference citations.

7. Modified the color of citation numbers in the .tex file.

8.Replaced "%\DeclareOption{namedate}{\PassOptionsToPackage{authoryear,round}{natbib}\global\@numbibfalse}" with "\DeclareOption{namedate}{\PassOptionsToPackage{numbers,square,sort&compress}{natbib}\global\@numbibtrue}" in the .cls file.

9. Modified in line 1391 of the .cls file: \if@contemporary
    \if@large
          \hbox to \textwidth{{\includegraphics[width=45pt, height=55pt]{img/TBench.jpg}}\hfill
          \raisebox{-3.7pt}[0pt]{\hfill%
          \parbox[b]{416pt}{\raggedleft{{\fontsize{8bp}{10}\selectfont\itshape\hspace*{178pt} \@journaltitle,\rm\ \@copyrightyear}}\\[-.5pt]
          \hspace*{181pt}{\color{black!15}\rule{184pt}{2pt}}\\[1.6pt]  

## Main Files in This Bundle

- `TBench-template.cls` – LaTeX class file
- `TBench-template.tex` – Example document
- `TBench-template-sample.pdf` – Sample output

## How to Use

1. Download the entire template folder 
2. Edit `Tbench-template.tex` to write your article.
3. Compile as needed.


Copyright © 2025 BenchCouncil Press on Behalf of International Open Benchmark Council. All rights reserved.