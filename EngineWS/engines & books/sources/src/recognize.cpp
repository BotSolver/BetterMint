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

bool POS::IsDraw() const {

    // Draw by 50 move rule

    if (mRevMoves > 100) return true;

    // Draw by repetition

    for (int i = 4; i <= mRevMoves; i += 2)
        if (mHashKey == mRepList[mHead - i]) return true;

    // With no major pieces on the board, we have some heuristic draws to consider

    if (mCnt[WC][Q] + mCnt[BC][Q] + mCnt[WC][R] + mCnt[BC][R] == 0) {

        // Draw by insufficient material (bare kings or Km vs K)

        if (!Illegal()) {
            if (mCnt[WC][P] + mCnt[BC][P] == 0) {
                if (mCnt[WC][N] + mCnt[BC][N] + mCnt[WC][B] + mCnt[BC][B] <= 1) return true; // KK, KmK
            }
        }

        // Trivially drawn KPK endgames

        if (mCnt[WC][B] + mCnt[BC][B] + mCnt[WC][N] + mCnt[BC][N] == 0) {
            if (mCnt[WC][P] + mCnt[BC][P] == 1) {
                if (mCnt[WC][P] == 1) return KPKdraw(WC);  // exactly one white pawn
                if (mCnt[BC][P] == 1) return KPKdraw(BC);  // exactly one black pawn
            }
        } // pawns only
    }

    // Default: no draw

    return false;
}

bool POS::KPKdraw(eColor sd) const {

    eColor op = ~sd;
    U64 bbPawn = Pawns(sd);
    U64 bbStrongKing = Kings(sd);
    U64 bbWeakKing = Kings(op);

    // opposition through a pawn

    if (mSide == sd
    && (bbWeakKing & BB.ShiftFwd(bbPawn, sd))
    && (bbStrongKing & BB.ShiftFwd(bbPawn, op))
       ) return true;

    // weaker side can create opposition through a pawn in one move

    if (mSide == op
    && (BB.KingAttacks(mKingSq[op]) & BB.ShiftFwd(bbPawn, sd))
    && (bbStrongKing & BB.ShiftFwd(bbPawn, op))
       ) if (!Illegal()) return true;

    // opposition next to a pawn

    if (mSide == sd
    && (bbStrongKing & BB.ShiftSideways(bbPawn))
    && (bbWeakKing & BB.ShiftFwd(BB.ShiftFwd(bbStrongKing, sd), sd))
       ) return true;

    // TODO: pawn checks king

    return false;
}
