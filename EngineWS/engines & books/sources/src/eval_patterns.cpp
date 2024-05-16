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

void cEngine::EvaluateBishopPatterns(POS *p, eData *e) {

    if (p->Bishops(WC) & Mask.wb_special) {

        // white bishop trapped

        if (p->IsOnSq(WC, B, A6) && p->IsOnSq(BC, P, B5)) Add(e, WC, Par.values[B_TRAP_A3]);
        if (p->IsOnSq(WC, B, A7) && p->IsOnSq(BC, P, B6)) Add(e, WC, Par.values[B_TRAP_A2]);
        if (p->IsOnSq(WC, B, B8) && p->IsOnSq(BC, P, C7)) Add(e, WC, Par.values[B_TRAP_A2]);
        if (p->IsOnSq(WC, B, H6) && p->IsOnSq(BC, P, G5)) Add(e, WC, Par.values[B_TRAP_A3]);
        if (p->IsOnSq(WC, B, H7) && p->IsOnSq(BC, P, G6)) Add(e, WC, Par.values[B_TRAP_A2]);
        if (p->IsOnSq(WC, B, G8) && p->IsOnSq(BC, P, F7)) Add(e, WC, Par.values[B_TRAP_A2]);

        // white bishop blocked on its initial square by own pawn
        // or returning to protect castled king

        if (p->IsOnSq(WC, B, C1)) {
            if (p->IsOnSq(WC, P, D2) && (SqBb(D3) & p->OccBb()))
                Add(e, WC, Par.values[B_BLOCK], 0);
            if (p->Kings(WC) & (SqBb(B1) | SqBb(A1) | SqBb(A2)))
                Add(e, WC, Par.values[B_RETURN], 0);
        }

        if (p->IsOnSq(WC, B, F1)) {
            if (p->IsOnSq(WC, P, E2) && (SqBb(E3) & p->OccBb()))
            Add(e, WC, Par.values[B_BLOCK], 0);
            if (p->Kings(WC) & (SqBb(G1) | SqBb(H1) | SqBb(H2)))
                Add(e, WC, Par.values[B_RETURN], 0);
        }

        // white bishop fianchettoed

        if (p->IsOnSq(WC, B, B2)) {
            if (p->IsOnSq(WC, P, C3)) Add(e, WC, Par.values[B_BF_MG], Par.values[B_BF_EG]);
            if (p->IsOnSq(WC, P, B3) && (p->IsOnSq(WC, P, A2) || p->IsOnSq(WC, P, C2))) Add(e, WC, Par.values[B_FIANCH]);
            if (p->IsOnSq(BC, P, D4) && (p->IsOnSq(BC, P, E5) || p->IsOnSq(BC, P, C5))) Add(e, WC, Par.values[B_BADF]);
            if (p->Kings(WC) & Mask.qs_castle[WC]) Add(e, WC, Par.values[B_KING], 0);
        }

        if (p->IsOnSq(WC, B, G2)) {
            if (p->IsOnSq(WC, P, F3)) Add(e, WC, Par.values[B_BF_MG], Par.values[B_BF_EG]);
            if (p->IsOnSq(WC, P, G3) && (p->IsOnSq(WC, P, H2) || p->IsOnSq(WC, P, F2))) Add(e, WC, Par.values[B_FIANCH]);
            if (p->IsOnSq(BC, P, E4) && (p->IsOnSq(BC, P, D5) || p->IsOnSq(BC, P, F5))) Add(e, WC, Par.values[B_BADF]);
            if (p->Kings(WC) & Mask.ks_castle[WC]) Add(e, WC, Par.values[B_KING], 0);
        }
    }

    if (p->Bishops(BC) & Mask.bb_special) {

        // black bishop trapped

        if (p->IsOnSq(BC, B, A3) && p->IsOnSq(WC, P, B4)) Add(e, BC, Par.values[B_TRAP_A3]);
        if (p->IsOnSq(BC, B, A2) && p->IsOnSq(WC, P, B3)) Add(e, BC, Par.values[B_TRAP_A2]);
        if (p->IsOnSq(BC, B, B1) && p->IsOnSq(WC, P, C2)) Add(e, BC, Par.values[B_TRAP_A2]);
        if (p->IsOnSq(BC, B, H3) && p->IsOnSq(WC, P, G4)) Add(e, BC, Par.values[B_TRAP_A3]);
        if (p->IsOnSq(BC, B, H2) && p->IsOnSq(WC, P, G3)) Add(e, BC, Par.values[B_TRAP_A2]);
        if (p->IsOnSq(BC, B, G1) && p->IsOnSq(WC, P, F2)) Add(e, BC, Par.values[B_TRAP_A2]);

        // black bishop blocked on its initial square by own pawn
        // or returning to protect castled king

        if (p->IsOnSq(BC, B, C8)) {
            if (p->IsOnSq(BC, P, D7) && (SqBb(D6) & p->OccBb()))
                Add(e, BC, Par.values[B_BLOCK], 0);
            if (p->Kings(BC) & (SqBb(B8) | SqBb(A8) | SqBb(A7)))
                Add(e, BC, Par.values[B_RETURN], 0);
        }

        if (p->IsOnSq(BC, B, F8)) {
            if (p->IsOnSq(BC, P, E7) && (SqBb(E6) & p->OccBb()))
                Add(e, BC, Par.values[B_BLOCK], 0);
            if (p->Kings(BC) & (SqBb(G8) | SqBb(H8) | SqBb(H7)))
                Add(e, BC, Par.values[B_RETURN], 0);
        }

        // black bishop fianchettoed

        if (p->IsOnSq(BC, B, B7)) {
            if (p->IsOnSq(BC, P, C6)) Add(e, BC, Par.values[B_BF_MG], Par.values[B_BF_EG]);
            if (p->IsOnSq(BC, P, B6) && (p->IsOnSq(BC, P, A7) || p->IsOnSq(BC, P, C7))) Add(e, BC, Par.values[B_FIANCH]);
            if (p->IsOnSq(WC, P, D5) && (p->IsOnSq(WC, P, E4) || p->IsOnSq(WC, P, C4))) Add(e, BC, Par.values[B_BADF]);
            if (p->Kings(BC) & Mask.qs_castle[BC]) Add(e, BC, Par.values[B_KING], 0);
        }
        if (p->IsOnSq(BC, B, G7)) {
            if (p->IsOnSq(BC, P, F6)) Add(e, BC, Par.values[B_BF_MG], Par.values[B_BF_EG]);
            if (p->IsOnSq(BC, P, G6) && (p->IsOnSq(BC, P, H7) || p->IsOnSq(BC, P, G6))) Add(e, BC, Par.values[B_FIANCH]);
            if (p->IsOnSq(WC, P, E5) && (p->IsOnSq(WC, P, D4) || p->IsOnSq(WC, P, F4))) Add(e, BC, Par.values[B_BADF]);
            if (p->Kings(BC) & Mask.ks_castle[BC]) Add(e, BC, Par.values[B_KING], 0);
        }
    }

}

void cEngine::EvaluateKnightPatterns(POS *p, eData *e) {

    // trapped knight

    if (p->IsOnSq(WC, N, A7) && p->IsOnSq(BC, P, A6) && p->IsOnSq(BC, P, B7)) Add(e, WC, Par.values[N_TRAP]);
    if (p->IsOnSq(WC, N, H7) && p->IsOnSq(BC, P, H6) && p->IsOnSq(BC, P, G7)) Add(e, WC, Par.values[N_TRAP]);
    if (p->IsOnSq(BC, N, A2) && p->IsOnSq(WC, P, A3) && p->IsOnSq(WC, P, B2)) Add(e, BC, Par.values[N_TRAP]);
    if (p->IsOnSq(BC, N, H2) && p->IsOnSq(WC, P, H3) && p->IsOnSq(WC, P, G2)) Add(e, BC, Par.values[N_TRAP]);
}

void cEngine::EvaluateKingPatterns(POS *p, eData *e) {

    U64 king_mask, rook_mask;

    if (p->Kings(WC) & RANK_1_BB) {

        // White castled king that cannot escape upwards

        if (p->IsOnSq(WC, K, H1) && p->IsOnSq(WC, P, H2) && p->IsOnSq(WC, P, G2))
            Add(e, WC, Par.values[K_NO_LUFT]);

        if (p->IsOnSq(WC, K, G1) && p->IsOnSq(WC, P, H2) && p->IsOnSq(WC, P, G2) && p->IsOnSq(WC, P, F2))
            Add(e, WC, Par.values[K_NO_LUFT]);

        if (p->IsOnSq(WC, K, A1) && p->IsOnSq(WC, P, A2) && p->IsOnSq(WC, P, B2))
            Add(e, WC, Par.values[K_NO_LUFT]);

        if (p->IsOnSq(WC, K, B1) && p->IsOnSq(WC, P, A2) && p->IsOnSq(WC, P, B2) && p->IsOnSq(WC, P, C2))
            Add(e, WC, Par.values[K_NO_LUFT]);

        // White rook blocked by uncastled king

        king_mask = SqBb(F1) | SqBb(G1);
        rook_mask = SqBb(G1) | SqBb(H1) | SqBb(H2);

        if ((p->Kings(WC) & king_mask)
        && (p->Rooks(WC) & rook_mask)) Add(e, WC, Par.values[R_BLOCK_MG], Par.values[R_BLOCK_EG]);

        king_mask = SqBb(B1) | SqBb(C1);
        rook_mask = SqBb(A1) | SqBb(B1) | SqBb(A2);

        if ((p->Kings(WC) & king_mask)
        && (p->Rooks(WC) & rook_mask)) Add(e, WC, Par.values[R_BLOCK_MG], Par.values[R_BLOCK_EG]);

        // White castling rights

        if (p->IsOnSq(WC, K, E1)) {
            if ((p->mCFlags & W_KS)) Add(e, WC, Par.values[K_CASTLE], 0);
			else if ((p->mCFlags & W_QS)) Add(e, WC, (Par.values[K_CASTLE]*2)/3, 0);
        }
    }

    if (p->Kings(BC) & RANK_8_BB) {

        // Black castled king that cannot escape upwards

        if (p->IsOnSq(BC, K, H8) && p->IsOnSq(BC, P, H7) && p->IsOnSq(BC, P, G7))
            Add(e, BC, Par.values[K_NO_LUFT]);

        if (p->IsOnSq(BC, K, G8) && p->IsOnSq(BC, P, H7) && p->IsOnSq(BC, P, G7) && p->IsOnSq(BC, P, F7))
            Add(e, BC, Par.values[K_NO_LUFT]);

        if (p->IsOnSq(BC, K, A8) && p->IsOnSq(BC, P, A7) && p->IsOnSq(BC, P, B7))
            Add(e, BC, Par.values[K_NO_LUFT]);

        if (p->IsOnSq(BC, K, B8) && p->IsOnSq(BC, P, A7) && p->IsOnSq(BC, P, B7) && p->IsOnSq(BC, P, C7))
            Add(e, BC, Par.values[K_NO_LUFT]);

        // Black rook blocked by uncastled king

        king_mask = SqBb(F8) | SqBb(G8);
        rook_mask = SqBb(G8) | SqBb(H8) | SqBb(H7);

        if ((p->Kings(BC) & king_mask)
        && (p->Rooks(BC) & rook_mask)) Add(e, BC, Par.values[R_BLOCK_MG], Par.values[R_BLOCK_EG]);

        king_mask = SqBb(B8) | SqBb(C8);
        rook_mask = SqBb(B8) | SqBb(A8) | SqBb(A7);

        if ((p->Kings(BC) & king_mask)
        && (p->Rooks(BC) & rook_mask)) Add(e, BC, Par.values[R_BLOCK_MG], Par.values[R_BLOCK_EG]);

        // Black castling rights

        if (p->IsOnSq(BC, K, E8)) {
            if ((p->mCFlags & B_KS)) Add(e, BC, Par.values[K_CASTLE], 0);
			else if ((p->mCFlags & B_QS)) Add(e, BC, (Par.values[K_CASTLE]*2)/3, 0);
        }
    }
}

void cEngine::EvaluateCentralPatterns(POS *p, eData *e) {

    // Bishop and central pawn

    if (p->IsOnSq(WC, P, D4)) {
        if (p->Bishops(WC) & (SqBb(H2) | SqBb(G3) | SqBb(F4) | SqBb(G5) | SqBb(H4))) Add(e, WC, Par.values[B_WING], 0);
    }

    if (p->IsOnSq(WC, P, E4)) {
        if (p->Bishops(WC) & (SqBb(A2) | SqBb(B3) | SqBb(C4) | SqBb(B5) | SqBb(A4))) Add(e, WC, Par.values[B_WING], 0);
    }

    if (p->IsOnSq(BC, P, D5)) {
        if (p->Bishops(BC) & (SqBb(H7) | SqBb(G6) | SqBb(F5) | SqBb(G4) | SqBb(H5))) Add(e, BC, Par.values[B_WING], 0);
    }

    if (p->IsOnSq(BC, P, E5)) {
        if (p->Bishops(BC) & (SqBb(A7) | SqBb(B6) | SqBb(C5) | SqBb(B4) | SqBb(A5))) Add(e, BC, Par.values[B_WING], 0);
    }

    // Knight blocking c pawn

    if (p->IsOnSq(WC, P, C2) && p->IsOnSq(WC, P, D4) && p->IsOnSq(WC, N, C3)) {
        if ((p->Pawns(WC) & SqBb(E4)) == 0) Add(e, WC, Par.values[N_BLOCK], 0);
    }
    if (p->IsOnSq(BC, P, C7) && p->IsOnSq(BC, P, D5) && p->IsOnSq(BC, N, C6)) {
        if ((p->Pawns(BC) & SqBb(E5)) == 0) Add(e, BC, Par.values[N_BLOCK], 0);
    }
}
