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

void POS::UndoMove(int move, UNDO *u) {

    eColor sd = ~mSide;
    eColor op = ~sd;
    int fsq = Fsq(move);
    int tsq = Tsq(move);
    int ftp = Tp(mPc[tsq]); // moving piece
    int ttp = u->mTtpUd;

    mCFlags   = u->mCFlagsUd;
    mEpSq     = u->mEpSqUd;
    mRevMoves = u->mRevMovesUd;
    mHashKey  = u->mHashKeyUd;
    mPawnKey  = u->mPawnKeyUd;

    mHead--;

    mPc[fsq] = Pc(sd, ftp);
    mPc[tsq] = NO_PC;
    mClBb[sd] ^= SqBb(fsq) | SqBb(tsq);
    mTpBb[ftp] ^= SqBb(fsq) | SqBb(tsq);
    mMgSc[sd] += Par.mg_pst[sd][ftp][fsq] - Par.mg_pst[sd][ftp][tsq];
    mEgSc[sd] += Par.eg_pst[sd][ftp][fsq] - Par.eg_pst[sd][ftp][tsq];

    // Change king location

    if (ftp == K) mKingSq[sd] = fsq;

    // Uncapture enemy piece

    if (ttp != NO_TP) {
        mPc[tsq] = Pc(op, ttp);
        mClBb[op] ^= SqBb(tsq);
        mTpBb[ttp] ^= SqBb(tsq);
        mMgSc[op] += Par.mg_pst[op][ttp][tsq];
        mEgSc[op] += Par.eg_pst[op][ttp][tsq];
        mPhase += ph_value[ttp];
        mCnt[op][ttp]++;
    }

    switch (MoveType(move)) {

        case NORMAL:
            break;

        case CASTLE:

            // define complementary rook move

            switch (tsq) {
                case C1: { fsq = A1; tsq = D1; break; }
                case G1: { fsq = H1; tsq = F1; break; }
                case C8: { fsq = A8; tsq = D8; break; }
                case G8: { fsq = H8; tsq = F8; break; }
            }

            mPc[tsq] = NO_PC;
            mPc[fsq] = Pc(sd, R);
            mClBb[sd] ^= SqBb(fsq) | SqBb(tsq);
            mTpBb[R] ^= SqBb(fsq) | SqBb(tsq);
            mMgSc[sd] += Par.mg_pst[sd][R][fsq] - Par.mg_pst[sd][R][tsq];
            mEgSc[sd] += Par.eg_pst[sd][R][fsq] - Par.eg_pst[sd][R][tsq];
            break;

        case EP_CAP:
            tsq ^= 8;
            mPc[tsq] = Pc(op, P);
            mClBb[op] ^= SqBb(tsq);
            mTpBb[P] ^= SqBb(tsq);
            mMgSc[op] += Par.mg_pst[op][P][tsq];
            mEgSc[op] += Par.eg_pst[op][P][tsq];
            mPhase += ph_value[P];
            mCnt[op][P]++;
            break;

        case EP_SET:
            break;

        case N_PROM: case B_PROM: case R_PROM: case Q_PROM:
            mPc[fsq] = Pc(sd, P);
            mTpBb[P] ^= SqBb(fsq);
            mTpBb[ftp] ^= SqBb(fsq);
            mMgSc[sd] += Par.mg_pst[sd][P][fsq] - Par.mg_pst[sd][ftp][fsq];
            mEgSc[sd] += Par.eg_pst[sd][P][fsq] - Par.eg_pst[sd][ftp][fsq];
            mPhase += ph_value[P] - ph_value[ftp];
            mCnt[sd][P]++;
            mCnt[sd][ftp]--;
            break;
    }

    mSide = ~mSide;
}

void POS::UndoNull(UNDO *u) {

    mEpSq    = u->mEpSqUd;
    mHashKey = u->mHashKeyUd;
    mHead--;
    mRevMoves--;
    mSide = ~mSide;
}
