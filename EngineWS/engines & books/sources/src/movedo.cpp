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

void POS::DoMove(int move, UNDO *u) {

    eColor sd = mSide;      // moving side
    eColor op = ~sd;        // side not to move
    int fsq = Fsq(move);    // start square
    int tsq = Tsq(move);    // target square
    int ftp = Tp(mPc[fsq]); // moving piece
    int ttp = Tp(mPc[tsq]); // captured piece

    // Save data for undoing a move

    if (u) {
        u->mTtpUd      = ttp;
        u->mCFlagsUd   = mCFlags;
        u->mEpSqUd     = mEpSq;
        u->mRevMovesUd = mRevMoves;
        u->mHashKeyUd  = mHashKey;
        u->mPawnKeyUd  = mPawnKey;
    }

    // Update reversible moves counter

    mRepList[mHead++] = mHashKey;
    if (ftp == P || ttp != NO_TP) mRevMoves = 0;
    else                          mRevMoves++;

    // Update pawn hash on pawn or king move

    if (ftp == P || ftp == K)
        mPawnKey ^= msZobPiece[Pc(sd, ftp)][fsq] ^ msZobPiece[Pc(sd, ftp)][tsq];

    // Update castling rights

    mHashKey ^= msZobCastle[mCFlags];
    mCFlags &= msCastleMask[fsq] & msCastleMask[tsq];
    mHashKey ^= msZobCastle[mCFlags];

    // Clear en passant square

    if (mEpSq != NO_SQ) {
        mHashKey ^= msZobEp[File(mEpSq)];
        mEpSq = NO_SQ;
    }

    // Move own piece

    mPc[fsq] = NO_PC;
    mPc[tsq] = Pc(sd, ftp);
    mHashKey ^= msZobPiece[Pc(sd, ftp)][fsq] ^ msZobPiece[Pc(sd, ftp)][tsq];
    mClBb[sd] ^= SqBb(fsq) | SqBb(tsq);
    mTpBb[ftp] ^= SqBb(fsq) | SqBb(tsq);
    mMgSc[sd] += Par.mg_pst[sd][ftp][tsq] - Par.mg_pst[sd][ftp][fsq];
    mEgSc[sd] += Par.eg_pst[sd][ftp][tsq] - Par.eg_pst[sd][ftp][fsq];

    // Update king location

    if (ftp == K)
        mKingSq[sd] = tsq;

    // Capture enemy piece

    if (ttp != NO_TP) {
        mHashKey ^= msZobPiece[Pc(op, ttp)][tsq];

        if (ttp == P)
            mPawnKey ^= msZobPiece[Pc(op, ttp)][tsq]; // pawn hash

        mClBb[op] ^= SqBb(tsq);
        mTpBb[ttp] ^= SqBb(tsq);
        mMgSc[op] -= Par.mg_pst[op][ttp][tsq];
        mEgSc[op] -= Par.eg_pst[op][ttp][tsq];
        mPhase -= ph_value[ttp];
        mCnt[op][ttp]--; // piece count
    }

    switch (MoveType(move)) {
        case NORMAL:
            break;

        // Castling

        case CASTLE:

            // define complementary rook move

            switch (tsq) {
                case C1: { fsq = A1; tsq = D1; break; }
                case G1: { fsq = H1; tsq = F1; break; }
                case C8: { fsq = A8; tsq = D8; break; }
                case G8: { fsq = H8; tsq = F8; break; }
            }

            mPc[fsq] = NO_PC;
            mPc[tsq] = Pc(sd, R);
            mHashKey ^= msZobPiece[Pc(sd, R)][fsq] ^ msZobPiece[Pc(sd, R)][tsq];
            mClBb[sd] ^= SqBb(fsq) | SqBb(tsq);
            mTpBb[R] ^= SqBb(fsq) | SqBb(tsq);
            mMgSc[sd] += Par.mg_pst[sd][R][tsq] - Par.mg_pst[sd][R][fsq];
            mEgSc[sd] += Par.eg_pst[sd][R][tsq] - Par.eg_pst[sd][R][fsq];
            break;

        // En passant capture

        case EP_CAP:
            tsq ^= 8;
            mPc[tsq] = NO_PC;
            mHashKey ^= msZobPiece[Pc(op, P)][tsq];
            mPawnKey ^= msZobPiece[Pc(op, P)][tsq];
            mClBb[op] ^= SqBb(tsq);
            mTpBb[P] ^= SqBb(tsq);
            mMgSc[op] -= Par.mg_pst[op][P][tsq];
            mEgSc[op] -= Par.eg_pst[op][P][tsq];
            mPhase -= ph_value[P];
            mCnt[op][P]--;
            break;

        // Double pawn move

        case EP_SET:
            tsq ^= 8;
            if (BB.PawnAttacks(sd, tsq) & Pawns(op)) {
                mEpSq = tsq;
                mHashKey ^= msZobEp[File(tsq)];
            }
            break;

        // Promotion

        case N_PROM: case B_PROM: case R_PROM: case Q_PROM:
            ftp = PromType(move);
            mPc[tsq] = Pc(sd, ftp);
            mHashKey ^= msZobPiece[Pc(sd, P)][tsq] ^ msZobPiece[Pc(sd, ftp)][tsq];
            mPawnKey ^= msZobPiece[Pc(sd, P)][tsq];
            mTpBb[P] ^= SqBb(tsq);
            mTpBb[ftp] ^= SqBb(tsq);
            mMgSc[sd] += Par.mg_pst[sd][ftp][tsq] - Par.mg_pst[sd][P][tsq];
            mEgSc[sd] += Par.eg_pst[sd][ftp][tsq] - Par.eg_pst[sd][P][tsq];
            mPhase += ph_value[ftp] - ph_value[P];
            mCnt[sd][P]--;
            mCnt[sd][ftp]++;
            break;
    }

    // Change side to move

	mSide = ~mSide;
    mHashKey ^= SIDE_RANDOM;
}

void POS::DoNull(UNDO *u) {

    u->mEpSqUd    = mEpSq;
    u->mHashKeyUd = mHashKey;
    mRepList[mHead++] = mHashKey;
    mRevMoves++;
    if (mEpSq != NO_SQ) {
        mHashKey ^= msZobEp[File(mEpSq)];
        mEpSq = NO_SQ;
    }
	mSide = ~mSide;
    mHashKey ^= SIDE_RANDOM;
}
