/*
Rodent, a UCI chess playing engine derived from Sungorus 1.4
Copyright (C) 2009-2011 Pablo Vazquez (Sungorus author)
Copyright (C) 2011-2017 Pawel Koziol

Rodent is free software: you can redistribute it and/or modify it under the terms of the GNU
General Public License as published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

Rodent is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
General Public License for more details.

You should have received a copy of the GNU General Public License along with this program.
If not, see <http://www.gnu.org/licenses/>.
*/

#include "rodent.h"

U64 POS::Random64() {

    static U64 next = 1;

    next = next * 1103515245 + 12345;
    return next;
}

void POS::Init() { // static init function

    for (int sq = 0; sq < 64; sq++)
        msCastleMask[sq] = W_KS | W_QS | B_KS | B_QS;

    msCastleMask[A1] = W_KS |        B_KS | B_QS;
    msCastleMask[E1] =               B_KS | B_QS;
    msCastleMask[H1] =        W_QS | B_KS | B_QS;
    msCastleMask[A8] = W_KS | W_QS | B_KS       ;
    msCastleMask[E8] = W_KS | W_QS              ;
    msCastleMask[H8] = W_KS | W_QS        | B_QS;

    for (int i = 0; i < 12; i++)
        for (int j = 0; j < 64; j++)
            msZobPiece[i][j] = Random64();
    for (int i = 0; i < 16; i++)
        msZobCastle[i] = Random64();
    for (int i = 0; i < 8; i++)
        msZobEp[i] = Random64();
}
