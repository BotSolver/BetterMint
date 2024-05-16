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
#include <cstring>

static const int empty_ks[64] = {
    0,   0,   0,   0,   0, -10, -20, -30,
    0,   0,   0,   0,   0, -10, -20, -30,
    0,   0,   0,   0,   0, -10, -20, -30,
    0,   0,   0,   0,   0, -10, -20, -30,
    0,   0,   0,   0,   0, -10, -20, -30,
    0,   0,   0,   0,   0, -10, -20, -30,
    0,   0,   0,   0,   0, -10, -20, -30,
    0,   0,   0,   0,   0, -10, -20, -30
};

static const int empty_qs[64] = {
  -30, -20, -10,   0,   0,   0,   0,   0,
  -30, -20, -10,   0,   0,   0,   0,   0,
  -30, -20, -10,   0,   0,   0,   0,   0,
  -30, -20, -10,   0,   0,   0,   0,   0,
  -30, -20, -10,   0,   0,   0,   0,   0,
  -30, -20, -10,   0,   0,   0,   0,   0,
  -30, -20, -10,   0,   0,   0,   0,   0,
  -30, -20, -10,   0,   0,   0,   0,   0
};

void cEngine::ClearPawnHash() {

    ZEROARRAY(mPawnTT);
}

void cEngine::EvaluatePawnStruct(POS *p, eData *e) {

    // Try to retrieve score from pawn hashtable

    int addr = p->mPawnKey % PAWN_HASH_SIZE;

    if (mPawnTT[addr].key == p->mPawnKey) {

        // pawn hashtable contains delta of white and black score

        e->mg_pawns[WC] = mPawnTT[addr].mg_pawns;
        e->eg_pawns[WC] = mPawnTT[addr].eg_pawns;
        e->mg_pawns[BC] = 0;
        e->eg_pawns[BC] = 0;
        return;
    }

    // Clear values

    e->mg_pawns[WC] = 0;
    e->mg_pawns[BC] = 0;
    e->eg_pawns[WC] = 0;
    e->eg_pawns[BC] = 0;

    // Pawn structure

    EvaluatePawns(p, e, WC);
    EvaluatePawns(p, e, BC);

    // King's pawn shield
    // (also includes pawn chains eval)

    EvaluateKing(p, e, WC);
    EvaluateKing(p, e, BC);

    // Center binds (good) and wing binds (bad)
    // - important squares controlled by two pawns

    int tmp = 0;
    if (e->two_pawns_take[WC] & SqBb(D5)) tmp += Par.values[P_BIND];
    if (e->two_pawns_take[WC] & SqBb(E5)) tmp += Par.values[P_BIND];
    if (e->two_pawns_take[WC] & SqBb(D6)) tmp += Par.values[P_BIND];
    if (e->two_pawns_take[WC] & SqBb(E6)) tmp += Par.values[P_BIND];

    if (p->IsOnSq(WC, P, B3) && (e->two_pawns_take[WC] & SqBb(B5))) tmp -= Par.values[P_BADBIND];
    if (p->IsOnSq(WC, P, G3) && (e->two_pawns_take[WC] & SqBb(G5))) tmp -= Par.values[P_BADBIND];

    Add(e, WC, tmp, 0);

    tmp = 0;
    if (e->two_pawns_take[BC] & SqBb(D4)) tmp += Par.values[P_BIND];
    if (e->two_pawns_take[BC] & SqBb(E4)) tmp += Par.values[P_BIND];
    if (e->two_pawns_take[BC] & SqBb(D3)) tmp += Par.values[P_BIND];
    if (e->two_pawns_take[BC] & SqBb(E3)) tmp += Par.values[P_BIND];

    if (p->IsOnSq(BC, P, B6) && (e->two_pawns_take[BC] & SqBb(B4))) tmp -= Par.values[P_BADBIND];
    if (p->IsOnSq(BC, P, G6) && (e->two_pawns_take[BC] & SqBb(G4))) tmp -= Par.values[P_BADBIND];

    Add(e, BC, tmp, 0);


    // King on a wing without pawns

    U64 bb_all_pawns = p->Pawns(WC) | p->Pawns(BC);

    if (bb_all_pawns) {
        if (!(bb_all_pawns & Mask.k_side)) {
            AddPawns(e, WC, empty_ks[p->mKingSq[WC]], empty_ks[p->mKingSq[WC]]);
            AddPawns(e, BC, empty_ks[p->mKingSq[BC]], empty_ks[p->mKingSq[BC]]);
        }

        if (!(bb_all_pawns & Mask.q_side)) {
            AddPawns(e, WC, empty_qs[p->mKingSq[WC]], empty_qs[p->mKingSq[WC]]);
            AddPawns(e, BC, empty_qs[p->mKingSq[BC]], empty_qs[p->mKingSq[BC]]);
        }
    }

    // Evaluate number of pawn islands (based on Texel)

    const U64 w_pawns = p->Pawns(WC);
    const U64 w_pawn_files = BB.FillSouth(w_pawns) & 0xff;
    const int w_islands = BB.PopCnt(((~w_pawn_files) >> 1) & w_pawn_files);

    const U64 b_pawns = p->Pawns(BC);
    const U64 b_pawn_files = BB.FillSouth(b_pawns) & 0xff;
    const int b_islands = BB.PopCnt(((~b_pawn_files) >> 1) & b_pawn_files);
    e->mg_pawns[WC] -= (w_islands - b_islands) * Par.values[P_ISL];
    e->eg_pawns[WC] -= (w_islands - b_islands) * Par.values[P_ISL];
    // pawn islands code would also break detailed score display

    // Save stuff in pawn hashtable.
    // Note that we save delta between white and black scores.
    // It might become a problem if we decide to print detailed eval score.

    mPawnTT[addr].key = p->mPawnKey;
    mPawnTT[addr].mg_pawns = (Par.values[W_STRUCT] * (e->mg_pawns[WC] - e->mg_pawns[BC])) / 100;
    mPawnTT[addr].eg_pawns = (Par.values[W_STRUCT] * (e->eg_pawns[WC] - e->eg_pawns[BC])) / 100;
}

void cEngine::EvaluateKing(POS *p, eData *e, eColor sd) {

    const int qCastle[2] = { B1, B8 };
    const int kCastle[2] = { G1, G8 };
    U64 bb_king_file, bb_next_file;
    int shield = 0;
    int storm = 0;
    int sq = p->KingSq(sd);

    // Normalize king square for pawn shield evaluation,
    // to discourage shuffling the king between g1 and h1.

    if (SqBb(sq) & Mask.ks_castle[sd]) sq = kCastle[sd];
    if (SqBb(sq) & Mask.qs_castle[sd]) sq = qCastle[sd];

    // Evaluate shielding and storming pawns on each file.

    bb_king_file = BB.FillNorth(SqBb(sq)) | BB.FillSouth(SqBb(sq));
    EvaluateKingFile(p, sd, bb_king_file, &shield, &storm);

    bb_next_file = ShiftEast(bb_king_file);
    if (bb_next_file) EvaluateKingFile(p, sd, bb_next_file, &shield, &storm);

    bb_next_file = ShiftWest(bb_king_file);
    if (bb_next_file) EvaluateKingFile(p, sd, bb_next_file, &shield, &storm);

    AddPawns(e, sd, ((Par.values[W_SHIELD] * shield) / 100) + ((Par.values[W_STORM] * storm) / 100), 0);
    AddPawns(e, sd, EvaluateChains(p, sd), 0);
}

void cEngine::EvaluateKingFile(POS *p, eColor sd, U64 bb_file, int *shield, int *storm) {

    int shelter = EvaluateFileShelter(bb_file &  p->Pawns(sd), sd);
    if (p->Kings(sd) & bb_file) shelter = ((shelter * 120) / 100);
    if (bb_file & bb_central_file) shelter /= 2;
    *shield += shelter;
    *storm += EvaluateFileStorm(bb_file & p->Pawns(~sd), sd);
}

int cEngine::EvaluateFileShelter(U64 bb_own_pawns, eColor sd) {

    if (!bb_own_pawns) return Par.values[P_SH_NONE];
    if (bb_own_pawns & bb_rel_rank[sd][RANK_2]) return Par.values[P_SH_2];
    if (bb_own_pawns & bb_rel_rank[sd][RANK_3]) return Par.values[P_SH_3];
    if (bb_own_pawns & bb_rel_rank[sd][RANK_4]) return Par.values[P_SH_4];
    if (bb_own_pawns & bb_rel_rank[sd][RANK_5]) return Par.values[P_SH_5];
    if (bb_own_pawns & bb_rel_rank[sd][RANK_6]) return Par.values[P_SH_6];
    if (bb_own_pawns & bb_rel_rank[sd][RANK_7]) return Par.values[P_SH_7];
    return 0;
}

int cEngine::EvaluateFileStorm(U64 bb_opp_pawns, eColor sd) {

    if (!bb_opp_pawns) return Par.values[P_ST_OPEN];
    if (bb_opp_pawns & bb_rel_rank[sd][RANK_3]) return Par.values[P_ST_3];
    if (bb_opp_pawns & bb_rel_rank[sd][RANK_4]) return Par.values[P_ST_4];
    if (bb_opp_pawns & bb_rel_rank[sd][RANK_5]) return Par.values[P_ST_5];
    return 0;
}

#define SQ(sq) RelSqBb(sq,sd)
#define opPawns p->Pawns(op)
#define sdPawns p->Pawns(sd)
#define OWN_PAWN(sq) (p->Pawns(sd) & RelSqBb(sq,sd))
#define OPP_PAWN(sq) (p->Pawns(op) & RelSqBb(sq,sd))
#define CONTAINS(bb, s1, s2) ((bb) & SQ(s1)) && ((bb) & SQ(s2))

// @brief EvaluateChains() gives a penalty to side being at the receiving end of the pawn chain

int cEngine::EvaluateChains(POS *p, eColor sd) {

    int mg_result = 0;
    int sq = p->mKingSq[sd];
    eColor op = ~sd;

    // basic pointy chain

    if (SqBb(sq) & Mask.ks_castle[sd]) {

        if (OPP_PAWN(E4)) {
            if (CONTAINS(opPawns, D5, C6)) // c6-d5-e4 triad
                mg_result -= (CONTAINS(sdPawns, D4, E3)) ? Par.values[P_BIGCHAIN] : Par.values[P_SMALLCHAIN];

            if (CONTAINS(opPawns, D5, F3)) // d5-e4-f3 triad
                mg_result -= (OWN_PAWN(E3)) ? Par.values[P_BIGCHAIN] : Par.values[P_SMALLCHAIN];
        }

        if (OPP_PAWN(E5)) {
            if (CONTAINS(opPawns, F4, D6)) { // d6-e5-f4 triad
                // storm of a "g" pawn in the King's Indian
                if (OPP_PAWN(G5)) {
                    mg_result -= Par.values[P_CS1];
                    if (OPP_PAWN(H4)) return Par.values[P_CSFAIL]; // opponent did us a favour, rendering his chain immobile
                }
                if (OPP_PAWN(G4)) mg_result -= Par.values[P_CS2];

                mg_result -= (CONTAINS(sdPawns, E4, D5)) ? Par.values[P_BIGCHAIN] : Par.values[P_SMALLCHAIN];
            }

            if (CONTAINS(opPawns, G3, F4)) // e5-f4-g3 triad
                mg_result -= (OWN_PAWN(F3)) ? Par.values[P_BIGCHAIN] : Par.values[P_SMALLCHAIN];
        }
    }

    if (SqBb(sq) & Mask.qs_castle[sd]) {

        // basic pointy chain

        if (OPP_PAWN(D4)) {
            if (CONTAINS(opPawns, E5, F6))
                mg_result -= (CONTAINS(sdPawns, E4, D3)) ? Par.values[P_BIGCHAIN] : Par.values[P_SMALLCHAIN];

            if (CONTAINS(opPawns, F5, C3))
                mg_result -= (SQ(D3) & sdPawns) ? Par.values[P_BIGCHAIN] : Par.values[P_SMALLCHAIN];
        }

        if (OPP_PAWN(D5)) {
            if (CONTAINS(opPawns, C4, E6)) {
                // storm of a "b" pawn
                if (OPP_PAWN(B5)) {
                    mg_result -= Par.values[P_CS1];
                    if (OPP_PAWN(A4)) return Par.values[P_CSFAIL]; // opponent did us a favour, rendering his chain immobile
                }
                if (OPP_PAWN(B4)) mg_result -= Par.values[P_CS2];

                mg_result -= (CONTAINS(sdPawns, E4, D5)) ? Par.values[P_BIGCHAIN] : Par.values[P_SMALLCHAIN];
            }

            if (CONTAINS(opPawns, B3, C4))
                mg_result -= (OWN_PAWN(C3)) ? Par.values[P_BIGCHAIN] : Par.values[P_SMALLCHAIN];
        }
    }

    return (mg_result * Par.values[W_CHAINS]) / 100;
}
