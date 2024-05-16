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

bool POS::Legal(int move) const {

    eColor sd = mSide;
    int fsq = Fsq(move);
    int tsq = Tsq(move);
    int ftp = TpOnSq(fsq);
    int ttp = TpOnSq(tsq);

    if ((ftp == NO_TP || Cl(mPc[fsq]) != sd) ||
        (ttp != NO_TP && Cl(mPc[tsq]) == sd))
        return false;

    switch (MoveType(move)) {
        case NORMAL:
            break;
        case CASTLE:
            if (sd == WC) {
                if (fsq != E1)
                    return false;
                if (tsq > fsq) {
                    if ((mCFlags & W_KS) && !(OccBb() & UINT64_C(0x0000000000000060)))
                        if (!Attacked(E1, BC) && !Attacked(F1, BC))
                            return true;
                } else {
                    if ((mCFlags & W_QS) && !(OccBb() & UINT64_C(0x000000000000000E)))
                        if (!Attacked(E1, BC) && !Attacked(D1, BC))
                            return true;
                }
            } else {
                if (fsq != E8)
                    return false;
                if (tsq > fsq) {
                    if ((mCFlags & B_KS) && !(OccBb() & UINT64_C(0x6000000000000000)))
                        if (!Attacked(E8, WC) && !Attacked(F8, WC))
                            return true;
                } else {
                    if ((mCFlags & B_QS) && !(OccBb() & UINT64_C(0x0E00000000000000)))
                        if (!Attacked(E8, WC) && !Attacked(D8, WC))
                            return true;
                }
            }
            return false;
        case EP_CAP:
            if (ftp == P && tsq == mEpSq)
                return true;
            return false;
        case EP_SET:
            if (ftp == P && ttp == NO_TP && mPc[tsq ^ 8] == NO_PC)
                if ((tsq > fsq && sd == WC) ||
                    (tsq < fsq && sd == BC))
                    return true;
            return false;
    }

    if (ftp == P) {
        if (sd == WC) {
            if (Rank(fsq) == RANK_7 && !IsProm(move))
                return false;
            if (tsq - fsq == 8)
                if (ttp == NO_TP)
                    return true;
            if ((tsq - fsq == 7 && File(fsq) != FILE_A) ||
                (tsq - fsq == 9 && File(fsq) != FILE_H))
                if (ttp != NO_TP)
                    return true;
        } else {
            if (Rank(fsq) == RANK_2 && !IsProm(move))
                return false;
            if (tsq - fsq == -8)
                if (ttp == NO_TP)
                    return true;
            if ((tsq - fsq == -9 && File(fsq) != FILE_A) ||
                (tsq - fsq == -7 && File(fsq) != FILE_H))
                if (ttp != NO_TP)
                    return true;
        }
        return false;
    }

    if (IsProm(move))
        return false;

    return (AttacksFrom(fsq) & SqBb(tsq)) != 0;
}
