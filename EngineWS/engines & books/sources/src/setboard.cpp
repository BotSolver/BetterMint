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
#include <cstdio>
#include <cstring>

void POS::ClearPosition() {

    *this = {0};

    mKingSq[WC] = NO_SQ;
    mKingSq[BC] = NO_SQ;

    for (int sq = 0; sq < 64; sq++)
        mPc[sq] = NO_PC;

    mSide = WC;
    mEpSq = NO_SQ;
}

void POS::SetPosition(const char *epd) {

    static const char pc_char[] = "PpNnBbRrQqKk";

    ClearPosition();
    Glob.moves_from_start = 0;

    for (int i = 56; i >= 0; i -= 8) {
        int j = 0, pc_loop;
        while (j < 8) {
            if (*epd >= '1' && *epd <= '8')
                for (pc_loop = 0; pc_loop < *epd - '0'; pc_loop++) {
                    mPc[i + j] = NO_PC;
                    j++;
                }
            else {
                for (pc_loop = 0; pc_char[pc_loop] && pc_char[pc_loop] != *epd; pc_loop++)
                    ;

                if ( !pc_char[pc_loop] ) {
                    printf("info string FEN parsing error\n");
                    SetPosition(START_POS);
                    return;
                }

                mPc[i + j] = pc_loop;
                mClBb[Cl(pc_loop)] ^= SqBb(i + j);
                mTpBb[Tp(pc_loop)] ^= SqBb(i + j);

                if (Tp(pc_loop) == K)
                    mKingSq[Cl(pc_loop)] = i + j;

                mMgSc[Cl(pc_loop)] += Par.mg_pst[Cl(pc_loop)][Tp(pc_loop)][i + j];
                mEgSc[Cl(pc_loop)] += Par.eg_pst[Cl(pc_loop)][Tp(pc_loop)][i + j];
                mPhase += ph_value[Tp(pc_loop)];
                mCnt[Cl(pc_loop)][Tp(pc_loop)]++;
                j++;
            }
            epd++;
        }
        epd++;
    }
    if (*epd++ == 'w')
        mSide = WC;
    else
        mSide = BC;
    epd++;
    if (*epd == '-')
        epd++;
    else {
        if (*epd == 'K') {
            mCFlags |= W_KS;
            epd++;
        }
        if (*epd == 'Q') {
            mCFlags |= W_QS;
            epd++;
        }
        if (*epd == 'k') {
            mCFlags |= B_KS;
            epd++;
        }
        if (*epd == 'q') {
            mCFlags |= B_QS;
            epd++;
        }
    }
    epd++;
    if (*epd == '-')
        mEpSq = NO_SQ;
    else {
        mEpSq = Sq(*epd - 'a', *(epd + 1) - '1');
        if (!(BB.PawnAttacks(~mSide, mEpSq) & Pawns(mSide)))
            mEpSq = NO_SQ;
    }
    InitHashKey();
    InitPawnKey();
}
