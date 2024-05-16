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
#include "eval.h"
#include <cstdio>
#include <cstdlib>
#include <cmath>

void cParam::Recalculate() {

    InitPst();
    InitMobility();
    InitMaterialTweaks();
    InitBackward();
    InitPassers();
}

void cParam::DefaultWeights() {  // tuned automatically

    // Switch off weakening parameters

    nps_limit = 0;
    fl_weakening = false;
    elo = 2800;
    eval_blur = 0;

    // Opening book

    book_depth = 256;
    book_filter = 20;

    // Timing

    time_percentage = 100;

    // Piece values

    static const bool tunePieceValues = false;

    SetVal(P_MID,  100,  50, 150, tunePieceValues);
    SetVal(N_MID,  325, 200, 400, tunePieceValues);
    SetVal(B_MID,  340, 200, 400, tunePieceValues);
    SetVal(R_MID,  500, 400, 600, tunePieceValues);
    SetVal(Q_MID,  950, 800, 1200, tunePieceValues);

    SetVal(P_END,  101,  50, 150, tunePieceValues);
    SetVal(N_END,  320, 200, 400, tunePieceValues);
    SetVal(B_END,  340, 200, 400, tunePieceValues);
    SetVal(R_END,  505, 400, 600, tunePieceValues);
    SetVal(Q_END,  960, 800, 1200, tunePieceValues);

    // Tendency to keep own pieces

    keep_pc[P] = 8;
    keep_pc[N] = 10;
    keep_pc[B] = 10;
    keep_pc[R] = 0;
    keep_pc[Q] = 20;
    keep_pc[K] = 0;
    keep_pc[K + 1] = 0;

    // Material adjustments

    static const bool tuneAdj = false;

    SetVal(B_PAIR,  70, -100, 100, tuneAdj);
    SetVal(N_PAIR, -10, -50, 50, tuneAdj);
    SetVal(R_PAIR, -9, -50, 50, tuneAdj);
    SetVal(ELEPH, 10, -50, 50, tuneAdj);   // queen loses that much with each enemy minor on the board
    SetVal(A_EXC, -10, -50, 50, tuneAdj);   // exchange advantage additional bonus
    SetVal(A_MIN, 60, 0, 100, tuneAdj);    // additional bonus for a minor piece advantage
    SetVal(A_MAJ, 53, 0, 100, tuneAdj);    // additional bonus for a major piece advantage
    SetVal(A_TWO, 29, 0, 100, tuneAdj);    // additional bonus for two minors against a rook
    SetVal(A_ALL, 80, 0, 100, tuneAdj);    // additional bonus for advantage in both majors and minors
    SetVal(N_CL, 6, -50, 50, tuneAdj);     // knight gains this much with each own pawn present on the board
    SetVal(R_OP, 3, -50, 50, tuneAdj);     // rook loses that much with each own pawn present on the board  

    // King attack values

    // "_ATT1" values are awarded for attacking squares not defended by enemy pawns
    // "_ATT2" values are awarded for attacking squares defended by enemy pawns
    // "_CHK"  values are awarded for threatening check to enemy king
    // "_CONTACT" values are awarded for contact checks threats
    //
    // All these values are NOT the actual bonuses; their sum is used as index
    // to a non-linear king safety table. Tune them with extreme caution.

	// King attack values

    values[N_ATT1] = 6;
	values[N_ATT2] = 3;
	values[B_ATT1] = 6;
	values[B_ATT2] = 2;
	values[R_ATT1] = 9;
	values[R_ATT2] = 4;
	values[Q_ATT1] = 16;
	values[Q_ATT2] = 5;

	values[N_CHK] = 4;
	values[B_CHK] = 6;
	values[R_CHK] = 11;
	values[Q_CHK] = 12;

	values[R_CONTACT] = 24;
	values[Q_CONTACT] = 36;

	// King tropism

	values[NTR_MG] = 3;
	values[NTR_EG] = 3;
	values[BTR_MG] = 2;
	values[BTR_EG] = 1;
	values[RTR_MG] = 2;
	values[RTR_EG] = 1;
	values[QTR_MG] = 2;
	values[QTR_EG] = 4;

    // Varia

    SetVal(W_MATERIAL, 48,  0, 200, false);
    SetVal(W_PST, 100, 0, 200, false);
    pst_style = 0;
    mob_style = 0;

    // Attack and mobility weights that can be set independently for each side
    // - the core of personality mechanism

    SetVal(W_OWN_ATT, 450, 0, 500, false);
    SetVal(W_OPP_ATT, 100, 0, 500, false);
    SetVal(W_OWN_MOB, 125, 0, 500, false);
    SetVal(W_OPP_MOB, 100, 0, 500, false);

    // Positional weights

	static const bool tuneWeights = false;

    SetVal(W_THREATS, 190, 0, 500, tuneWeights);
    SetVal(W_TROPISM,  80, -500, 500, tuneWeights);
    SetVal(W_PASSERS, 127, 0, 500, tuneWeights);
    SetVal(W_MASS,     98, 0, 500, tuneWeights);
    SetVal(W_CHAINS,  100, 0, 500, tuneWeights);
    SetVal(W_OUTPOSTS, 100, 0, 500, tuneWeights);
    SetVal(W_LINES,   109, 0, 500, tuneWeights);
    SetVal(W_STRUCT,   90, 0, 500, tuneWeights);
    SetVal(W_SHIELD,  189, 0, 500, tuneWeights);
    SetVal(W_STORM,   191, 0, 500, tuneWeights);
    SetVal(W_CENTER,   50, 0, 500, tuneWeights);

    // Pawn structure parameters

	// Pawn structure parameters

	values[DB_MID] = -12;  // doubled
	values[DB_END] = -23;
	values[ISO_MG] = -10;  // isolated
	values[ISO_EG] = -20;
	values[ISO_OF] = -10;  // additional midgame penalty for isolated pawn on an open file
	values[BK_MID] = -8;   // backward
	values[BK_END] = -8;
	values[BK_OPE] = -10;  // additional midgame penalty for backward pawn on an open file
	values[P_BIND] = 5;    // two pawns control central square
	values[P_BADBIND] = 10; // penalty for a "wing triangle" like a4-b3-c4
	values[P_ISL] = 7;     // penalty for each pawn island
	values[P_THR] = 4;     // pawn move threatens to attack enemy minor

    // Pawn chain values

    static const bool tuneChain = false;

    SetVal(P_BIGCHAIN, 38, 0, 50, tuneChain);   // general penalty for a compact pawn chain pointing at our king
    SetVal(P_SMALLCHAIN, 27, 0, 50, tuneChain); // similar penalty for a chain that is not fully blocked by enemy pawns
    SetVal(P_CS1, 12, 0, 50, tuneChain);        // bonus for a pawn storm next to a fixed chain - like g5 in King's Indian
    SetVal(P_CS2, 3, 0, 50, tuneChain);         // as above, this time like g4 in King's Indian
    SetVal(P_CSFAIL, 32, 0, 50, tuneChain);     // penalty for misplaying pawn strom next to a chain

    // Passed pawn bonuses per rank

    static const bool tunePassers = false;

    SetVal(PMG2,   2, 0, 300, tunePassers);
    SetVal(PMG3,   2, 0, 300, tunePassers);
    SetVal(PMG4,  11, 0, 300, tunePassers);
    SetVal(PMG5,  33, 0, 300, tunePassers);
    SetVal(PMG6,  71, 0, 300, tunePassers);
    SetVal(PMG7, 135, 0, 300, tunePassers);

    SetVal(PEG2,  12, 0, 300, tunePassers);
    SetVal(PEG3,  21, 0, 300, tunePassers);
    SetVal(PEG4,  48, 0, 300, tunePassers);
    SetVal(PEG5,  93, 0, 300, tunePassers);
    SetVal(PEG6, 161, 0, 300, tunePassers);
    SetVal(PEG7, 266, 0, 300, tunePassers);

    // Passed pawn value percentage modifiers

    SetVal(P_BL_MUL, 42, 0, 50, tunePassers);      // blocked passer
    SetVal(P_OURSTOP_MUL, 27, 0, 50, tunePassers); // side with a passer controls its stop square
    SetVal(P_OPPSTOP_MUL, 29, 0, 50, tunePassers); // side playing against a passer controls its stop square
    SetVal(P_DEFMUL, 6, 0, 50, tunePassers);       // passer defended by own pawn
    SetVal(P_STOPMUL, 6, 0, 50, tunePassers);      // passers' stop square defended by own pawn

												   // Passed pawn bonuses per rank

	static const bool tuneCandidates = true;

	SetVal(CMG2, 2/3, 0, 300, tuneCandidates);
	SetVal(CMG3, 2/3, 0, 300, tuneCandidates);
	SetVal(CMG4, 11/3, 0, 300, tuneCandidates);
	SetVal(CMG5, 33/3, 0, 300, tuneCandidates);
	SetVal(CMG6, 71/3, 0, 300, tuneCandidates);
	SetVal(CMG7, 135/3, 0, 300, false);

	SetVal(CEG2, 12/3, 0, 300, tuneCandidates);
	SetVal(CEG3, 21/3, 0, 300, tuneCandidates);
	SetVal(CEG4, 48/3, 0, 300, tuneCandidates);
	SetVal(CEG5, 93/3, 0, 300, tuneCandidates);
	SetVal(CEG6, 161/3, 0, 300, tuneCandidates);
	SetVal(CEG7, 266/3, 0, 300, false);

    // King's pawn shield

    static const bool tuneShield = false;

    SetVal(P_SH_NONE, -40, -50, 50, tuneShield);
    SetVal(P_SH_2,   2, -50, 50, tuneShield);
    SetVal(P_SH_3,  -6, -50, 50, tuneShield);
    SetVal(P_SH_4, -15, -50, 50, tuneShield);
    SetVal(P_SH_5, -23, -50, 50, tuneShield);
    SetVal(P_SH_6, -24, -50, 50, tuneShield);
    SetVal(P_SH_7, -35, -50, 50, tuneShield);

    // Pawn storm

    SetVal(P_ST_OPEN, -6, -50, 50, tuneShield);
    SetVal(P_ST_3, -16, -50, 50, tuneShield);
    SetVal(P_ST_4, -16, -50, 50, tuneShield);
    SetVal(P_ST_5, -3, -50, 50, tuneShield);

    // Knight parameters

    static const bool tuneKnight = false;

    SetVal(N_TRAP, -168, -300, 0, tuneKnight); // trapped knight
    SetVal(N_BLOCK, -17, -50, 0, tuneKnight);  // knight blocks c pawn in queen pawn openings
    SetVal(N_OWH, -1, -50, 0, tuneKnight);     // knight can move only to own half of the board
    SetVal(N_REACH, 11, 0, 50, tuneKnight);    // knight can reach an outpost square
    SetVal(BN_SHIELD,  5,  0, 50, tuneKnight); // pawn in front of a minor

    // Bishop parameters

    static const bool tuneBishop = false;

    SetVal(B_FIANCH, 13, 0, 50, tuneBishop);   // general bonus for fianchettoed bishop
    SetVal(B_KING, 20, 0, 50, tuneBishop);     // fianchettoed bishop near own king
    SetVal(B_BADF, -27, -50, 0, tuneBishop);   // enemy pawns hamper fianchettoed bishop 
    SetVal(B_TRAP_A2, -138, -300, 0, tuneBishop);
    SetVal(B_TRAP_A3, -45, -300, 0, tuneBishop);
    SetVal(B_BLOCK, -45, -100, 0, tuneBishop); // blocked pawn at d2/e2 hampers bishop's development
    SetVal(B_BF_MG, -12, -50, 0, tuneBishop);  // fianchettoed bishop blocked by own pawn (ie. Bg2, Pf3)
    SetVal(B_BF_EG, -20, -50, 0, tuneBishop);
    SetVal(B_WING, 3, 0, 50, tuneBishop);      // bishop on "expected" wing (ie. Pe4, Bc5/b5/a4/b3/c2) 
    SetVal(B_OWH, -7, -50, 0, tuneBishop);     // bishop can move only to own half of the board
    SetVal(B_REACH, 2, 0, 50, tuneBishop);     // bishop can reach an outpost square
    SetVal(B_TOUCH, 5, 0, 50, tuneBishop);     // two bishops on adjacent squares
    SetVal(B_OWN_P, -3, -50, 0, false);  // own pawn on the square of own bishop's color
    SetVal(B_OPP_P, -1, -50, 0, false);  // enemy pawn on the square of own bishop's color
    SetVal(B_RETURN, 7, 0, 50, tuneBishop);    // bishop returning to initial position after castling

    // Rook parameters

    static const bool tuneRook = false;

    SetVal(RSR_MG, 16, 0, 50, tuneRook); // rook on the 7th rank
    SetVal(RSR_EG, 32, 0, 50, tuneRook);
    SetVal(RS2_MG, 20, 0, 50, tuneRook); // additional bonus for two rooks on 7th rank
    SetVal(RS2_EG, 31, 0, 50, tuneRook);
    SetVal(ROF_MG, 30, 0, 50, tuneRook); // rook on open file
    SetVal(ROF_EG,  2, 0, 50, tuneRook);
    SetVal(RGH_MG, 15, 0, 50, tuneRook); // rook on half-open file with undefended enemy pawn
    SetVal(RGH_EG, 20, 0, 50, tuneRook);
    SetVal(RBH_MG,  0, 0, 50, tuneRook); // rook on half-open file with defended enemy pawn
    SetVal(RBH_EG,  0, 0, 50, tuneRook);
    SetVal(ROQ_MG,  9, 0, 50, tuneRook); // rook and queen on the same file, open or closed
    SetVal(ROQ_EG, 18, 0, 50, tuneRook);
    SetVal(R_BLOCK_MG, -50, -100, 0, tuneRook);
    SetVal(R_BLOCK_EG, 0, -100, 0, tuneRook);

    // Queen parameters

	static const bool tuneQueen = false;

    SetVal(QSR_MG, 0, 0, 50, tuneQueen);       // queen on the 7th rank
    SetVal(QSR_EG, 2, 0, 50, tuneQueen);

    // King parameters

    static const bool tuneKing = false;

    SetVal(K_NO_LUFT, -11, -50, 0, tuneKing); // queen on the 7th rank
    SetVal(K_CASTLE, 32, 0, 50, tuneKing);

    // Forwardness parameters

    static const bool tuneFwd = false;

    SetVal(W_FWD, 0, -500, 500, tuneFwd);
    SetVal(N_FWD,   1, 0, 50, tuneFwd);
    SetVal(B_FWD,   1, 0, 50, tuneFwd);
    SetVal(R_FWD,   2, 0, 50, tuneFwd);
    SetVal(Q_FWD,   4, 0, 50, tuneFwd);

    // Mobility

    static const bool tuneMobility = false;

    SetVal(NMG0, -32, -50, 50, tuneMobility);
    SetVal(NMG1, -14, -50, 50, tuneMobility);
    SetVal(NMG2,  -7, -50, 50, tuneMobility);
    SetVal(NMG3,  -7, -50, 50, tuneMobility);
    SetVal(NMG4,   2, -50, 50, tuneMobility);
    SetVal(NMG5,   7, -50, 50, tuneMobility);
    SetVal(NMG6,  13, -50, 50, tuneMobility);
    SetVal(NMG7,  13, -50, 50, tuneMobility);
    SetVal(NMG8,  25, -50, 50, tuneMobility);

    SetVal(NEG0, -41, -50, 50, tuneMobility);
    SetVal(NEG1, -20, -50, 50, tuneMobility);
    SetVal(NEG2,  -7, -50, 50, tuneMobility);
    SetVal(NEG3,   0, -50, 50, tuneMobility);
    SetVal(NEG4,   3, -50, 50, tuneMobility);
    SetVal(NEG5,  12, -50, 50, tuneMobility);
    SetVal(NEG6,   9, -50, 50, tuneMobility);
    SetVal(NEG7,  11, -50, 50, tuneMobility);
    SetVal(NEG8,   2, -50, 50, tuneMobility);

    SetVal(BMG0, -41, -50, 50, tuneMobility);
    SetVal(BMG1, -24, -50, 50, tuneMobility);
    SetVal(BMG2, -16, -50, 50, tuneMobility);
    SetVal(BMG3,  -9, -50, 50, tuneMobility);
    SetVal(BMG4,  -7, -50, 50, tuneMobility);
    SetVal(BMG5,   0, -50, 50, tuneMobility);
    SetVal(BMG6,   4, -50, 50, tuneMobility);
    SetVal(BMG7,   6, -50, 50, tuneMobility);
    SetVal(BMG8,   8, -50, 50, tuneMobility);
    SetVal(BMG9,  10, -50, 50, tuneMobility);
    SetVal(BMG10, 16, -50, 50, tuneMobility);
    SetVal(BMG11, 24, -50, 50, tuneMobility);
    SetVal(BMG12, 17, -50, 50, tuneMobility);
    SetVal(BMG13, 22, -50, 50, tuneMobility);

    SetVal(BEG0, -43, -50, 50, tuneMobility);
    SetVal(BEG1, -40, -50, 50, tuneMobility);
    SetVal(BEG2, -19, -50, 50, tuneMobility);
    SetVal(BEG3,  -6, -50, 50, tuneMobility);
    SetVal(BEG4,   1, -50, 50, tuneMobility);
    SetVal(BEG5,   3, -50, 50, tuneMobility);
    SetVal(BEG6,   5, -50, 50, tuneMobility);
    SetVal(BEG7,   8, -50, 50, tuneMobility);
    SetVal(BEG8,  15, -50, 50, tuneMobility);
    SetVal(BEG9,  11, -50, 50, tuneMobility);
    SetVal(BEG10, 10, -50, 50, tuneMobility);
    SetVal(BEG11, 13, -50, 50, tuneMobility);
    SetVal(BEG12, 22, -50, 50, tuneMobility);
    SetVal(BEG13, 19, -50, 50, tuneMobility);

    SetVal(RMG0, -14, -50, 50, tuneMobility);
    SetVal(RMG1, -16, -50, 50, tuneMobility);
    SetVal(RMG2, -14, -50, 50, tuneMobility);
    SetVal(RMG3,  -9, -50, 50, tuneMobility);
    SetVal(RMG4,  -9, -50, 50, tuneMobility);
    SetVal(RMG5, -10, -50, 50, tuneMobility);
    SetVal(RMG6,  -5, -50, 50, tuneMobility);
    SetVal(RMG7,  -2, -50, 50, tuneMobility);
    SetVal(RMG8,  -3, -50, 50, tuneMobility);
    SetVal(RMG9,  -2, -50, 50, tuneMobility);
    SetVal(RMG10,  5, -50, 50, tuneMobility);
    SetVal(RMG11,  7, -50, 50, tuneMobility);
    SetVal(RMG12,  9, -50, 50, tuneMobility);
    SetVal(RMG13, 23, -50, 50, tuneMobility);
    SetVal(RMG14, 24, -50, 50, tuneMobility);

    SetVal(REG0, -28, -50, 50, tuneMobility);
    SetVal(REG1, -50, -50, 50, tuneMobility);
    SetVal(REG2, -38, -50, 50, tuneMobility);
    SetVal(REG3, -14, -50, 50, tuneMobility);
    SetVal(REG4,  -9, -50, 50, tuneMobility);
    SetVal(REG5,   1, -50, 50, tuneMobility);
    SetVal(REG6,   2, -50, 50, tuneMobility);
    SetVal(REG7,   8, -50, 50, tuneMobility);
    SetVal(REG8,   9, -50, 50, tuneMobility);
    SetVal(REG9,  15, -50, 50, tuneMobility);
    SetVal(REG10, 18, -50, 50, tuneMobility);
    SetVal(REG11, 22, -50, 50, tuneMobility);
    SetVal(REG12, 22, -50, 50, tuneMobility);
    SetVal(REG13, 24, -50, 50, tuneMobility);
    SetVal(REG14, 29, -50, 50, tuneMobility);

    draw_score = 0;
    shut_up = false;       // true suppresses displaying info currmove etc.

    Recalculate();         // some values need to be calculated anew after the parameter change

    // History limit to prunings and reductions

    hist_perc = 175;
    hist_limit = 24576;
}

void cParam::InitialPersonalityWeights() { // tuned manually for good experience of Rodent personalities

    // Switch off weakening parameters

    nps_limit = 0;
    fl_weakening = false;
    elo = 2800;
    eval_blur = 0;

    // Opening book

    book_depth = 256;
    book_filter = 20;

    // Timing

    time_percentage = 100;

    // Piece values

    values[P_MID] = 95;
    values[N_MID] = 310;
    values[B_MID] = 322;
    values[R_MID] = 514;
    values[Q_MID] = 1000;

    values[P_END] = 110;
    values[N_END] = 305;
    values[B_END] = 320;
    values[R_END] = 529;
    values[Q_END] = 1013;

    // Tendency to keep own pieces

    keep_pc[P] = 0;
    keep_pc[N] = 0;
    keep_pc[B] = 0;
    keep_pc[R] = 0;
    keep_pc[Q] = 0;
    keep_pc[K] = 0;
    keep_pc[K + 1] = 0;

    // Material adjustments

    values[B_PAIR]  = 51;
    values[N_PAIR]  = -9;
    values[R_PAIR]  = -9;
    values[ELEPH]  = 4;  // queen loses that much with each enemy minor on the board
    values[A_EXC]  = 30; // exchange advantage additional bonus
    values[A_MIN] = 53;  // additional bonus for minor piece advantage
    values[A_MAJ] = 60;  // additional bonus for major piece advantage
    values[A_TWO] = 44;  // additional bonus for two minors for a rook
    values[A_ALL] = 80;  // additional bonus for advantage in both majors and minors
    values[N_CL]  = 6;   // knight gains this much with each own pawn present on th board
    values[R_OP]  = 3;   // rook loses that much with each own pawn present on the board

    // King attack values

    values[N_ATT1] = 6;
    values[N_ATT2] = 3;
    values[B_ATT1] = 6;
    values[B_ATT2] = 2;
    values[R_ATT1] = 9;
    values[R_ATT2] = 4;
    values[Q_ATT1] = 16;
    values[Q_ATT2] = 5;

    values[N_CHK] = 4;
    values[B_CHK] = 6;
    values[R_CHK] = 11;
    values[Q_CHK] = 12;

    values[R_CONTACT] = 24;
    values[Q_CONTACT] = 36;

    // King tropism

    values[NTR_MG] = 3;
    values[NTR_EG] = 3;
    values[BTR_MG] = 2;
    values[BTR_EG] = 1;
    values[RTR_MG] = 2;
    values[RTR_EG] = 1;
    values[QTR_MG] = 2;
    values[QTR_EG] = 4;

    // Varia

    values[W_MATERIAL] = 100;
    values[W_PST] = 75;
    pst_style = 0;
    mob_style = 0;         // 1 is only marginally behind
    draw_score = 0;
    shut_up = false;       // true suppresses displaying info currmove etc.

    // Attack and mobility weights that can be set independently for each side
    // - the core of personality mechanism

    values[W_OWN_ATT] = 100;
    values[W_OPP_ATT] = 100;
    values[W_OWN_MOB] = 100;
    values[W_OPP_MOB] = 100;

    // Positional weights

    values[W_THREATS] = 109;
    values[W_TROPISM] = 20;
    values[W_FWD] = 0;
    values[W_PASSERS] = 100;
    values[W_MASS] = 100;
    values[W_CHAINS] = 100;
    values[W_OUTPOSTS] = 78;
    values[W_LINES] = 100;
    values[W_STRUCT] = 100;
    values[W_SHIELD] = 119;
    values[W_STORM] = 99;
    values[W_CENTER] = 50;

    // Pawn structure parameters

    values[DB_MID] = -12;  // doubled
    values[DB_END] = -23;
    values[ISO_MG] = -10;  // isolated
    values[ISO_EG] = -20;
    values[ISO_OF] = -10;  // additional midgame penalty for isolated pawn on an open file
    values[BK_MID] = -8;   // backward
    values[BK_END] = -8;
    values[BK_OPE] = -10;  // additional midgame penalty for backward pawn on an open file
    values[P_BIND] = 5;    // two pawns control central square
    values[P_BADBIND] = 10; // penalty for a "wing triangle" like a4-b3-c4
    values[P_ISL] = 7;     // penalty for each pawn island
    values[P_THR] = 4;     // pawn move threatens to attack enemy minor

    // Pawn chain values

    values[P_BIGCHAIN] = 18; // general penalty for a compact pawn chain pointing at our king
    values[P_SMALLCHAIN] = 13; // similar penalty for a chain that is not fully blocked by enemy pawns
    values[P_CS1] = 4;         // additional evaluation of a pawn storm next to a fixed chain - like g5 in King's Indian
    values[P_CS2] = 12;        // as above, this time like g4 in King's Indian
    values[P_CSFAIL] = 10;     // penalty for a badly performed pawn storm next to a chain


    // Passed pawn bonuses per rank

    values[PMG2] = 11;
    values[PMG3] = 12;
    values[PMG4] = 24;
    values[PMG5] = 45;
    values[PMG6] = 78;
    values[PMG7] = 130;

    values[PEG2] = 22;
    values[PEG3] = 23;
    values[PEG4] = 57;
    values[PEG5] = 96;
    values[PEG6] = 161;
    values[PEG7] = 260;

    // Passed pawn value percentage modifiers

    values[P_BL_MUL] = 24;      // blocked passer
    values[P_OURSTOP_MUL] = 14; // side with a passer controls its stop square
    values[P_OPPSTOP_MUL] = 10; // side without a passer controls its stop square
    values[P_DEFMUL] = 4;       // passer defended by own pawn
    values[P_STOPMUL] = 4;      // passers' stop square defended by own pawn

    // Candidate passer bonuses per rank

    values[CMG2] = 11/3;
    values[CMG3] = 12/3;
    values[CMG4] = 24/3;
    values[CMG5] = 45/3;
    values[CMG6] = 78/3;
    values[CMG7] = 130/3;

    values[CEG2] = 22/3;
    values[CEG3] = 23/3;
    values[CEG4] = 57/3;
    values[CEG5] = 96 /3;
    values[CEG6] = 161 /3;
    values[CEG7] = 260 /3;

    // King's pawn shield

    values[P_SH_NONE] = -36;
    values[P_SH_2]    =   2;
    values[P_SH_3]    = -11;
    values[P_SH_4]    = -20;
    values[P_SH_5]    = -27;
    values[P_SH_6]    = -32;
    values[P_SH_7]    = -35;

    // Pawn storm

    values[P_ST_OPEN] = -16;
    values[P_ST_3] = -32;
    values[P_ST_4] = -16;
    values[P_ST_5] = -8;

    // Knight parameters

    values[N_TRAP] = -150; // trapped knight
    values[N_BLOCK] = -20; // knight blocks c pawn in queen pawn openings
    values[N_OWH] = -5;    // knight can move only to own half of the board
    values[N_REACH] = 4;   // knight can reach an outpost square WAS 2
    values[BN_SHIELD] = 5;

    // Bishop parameters

    values[B_FIANCH] = 4;  // general bonus for fianchettoed bishop
    values[B_KING] = 6;    // fianchettoed bishop near king: 0
    values[B_BADF] = -20;  // enemy pawns hamper fianchettoed bishop
    values[B_TRAP_A2] = -150;
    values[B_TRAP_A3] = -50;
    values[B_BLOCK] = -50; // blocked pawn at d2/e2 hampers bishop's development
    values[B_BF_MG] = -10; // fianchettoed bishop blocked by own pawn (ie. Bg2, Pf3)
    values[B_BF_EG] = -20;
    values[B_WING] = 10;   // bishop on "expected" wing (ie. Pe4, Bc5/b5/a4/b3/c2)
    values[B_OWH] = -5;    // bishop can move only to own half of the board
    values[B_REACH] = 2;   // bishop can reach an outpost square
    values[B_TOUCH] = 4;   // two bishops on adjacent squares
    values[B_OWN_P] = -3;  // own pawn on the square of own bishop's color
    values[B_OPP_P] = -1;  // enemy pawn on the square of own bishop's color
    values[B_RETURN] = 10; // bishop returning to initial position after castling

    // Rook parameters

    values[RSR_MG] = 16; // rook on 7th rank
    values[RSR_EG] = 32;
    values[RS2_MG] = 8;  // additional bonus for two rooks on 7th rank
    values[RS2_EG] = 16;
    values[ROF_MG] = 14; // rook on open file
    values[ROF_EG] = 14;
    values[RGH_MG] = 7;  // rook on half-open file with undefended enemy pawn
    values[RGH_EG] = 7;
    values[RBH_MG] = 5;  // rook on half-open file with defended enemy pawn
    values[RBH_EG] = 5;
    values[ROQ_MG] = 5;  // rook and queen on the same file, open or closed
    values[ROQ_EG] = 5;
    values[R_BLOCK_MG] = -50;
    values[R_BLOCK_EG] =   0;

    // Queen parameters

    values[QSR_MG] = 4;  // queen on the 7th rank
    values[QSR_EG] = 8;

    // King parameters

    values[K_NO_LUFT] = -15;
    values[K_CASTLE] = 10;

    // Forwardness parameters

    values[N_FWD] = 1;
    values[B_FWD] = 1;
    values[R_FWD] = 2;
    values[Q_FWD] = 4;

    Recalculate();         // some values need to be calculated anew after the parameter change

    // History limit to prunings and reductions

    hist_perc = 175;
    hist_limit = 24576;

    // when testing a personality, place changes in relation to default below:

}

void cParam::InitPassers() {

    passed_bonus_mg[WC][0] = 0;                passed_bonus_mg[BC][7] = 0;
    passed_bonus_mg[WC][1] = values[PMG2];     passed_bonus_mg[BC][6] = values[PMG2];
    passed_bonus_mg[WC][2] = values[PMG3];     passed_bonus_mg[BC][5] = values[PMG3];
    passed_bonus_mg[WC][3] = values[PMG4];     passed_bonus_mg[BC][4] = values[PMG4];
    passed_bonus_mg[WC][4] = values[PMG5];     passed_bonus_mg[BC][3] = values[PMG5];
    passed_bonus_mg[WC][5] = values[PMG6];     passed_bonus_mg[BC][2] = values[PMG6];
    passed_bonus_mg[WC][6] = values[PMG7];     passed_bonus_mg[BC][1] = values[PMG7];
    passed_bonus_mg[WC][7] = 0;                passed_bonus_mg[BC][0] = 0;

    passed_bonus_eg[WC][0] = 0;                passed_bonus_eg[BC][7] = 0;
    passed_bonus_eg[WC][1] = values[PEG2];     passed_bonus_eg[BC][6] = values[PEG2];
    passed_bonus_eg[WC][2] = values[PEG3];     passed_bonus_eg[BC][5] = values[PEG3];
    passed_bonus_eg[WC][3] = values[PEG4];     passed_bonus_eg[BC][4] = values[PEG4];
    passed_bonus_eg[WC][4] = values[PEG5];     passed_bonus_eg[BC][3] = values[PEG5];
    passed_bonus_eg[WC][5] = values[PEG6];     passed_bonus_eg[BC][2] = values[PEG6];
    passed_bonus_eg[WC][6] = values[PEG7];     passed_bonus_eg[BC][1] = values[PEG7];
    passed_bonus_eg[WC][7] = 0;                passed_bonus_eg[BC][0] = 0;

	cand_bonus_mg[WC][0] = 0;                cand_bonus_mg[BC][7] = 0;
	cand_bonus_mg[WC][1] = values[CMG2];     cand_bonus_mg[BC][6] = values[CMG2];
	cand_bonus_mg[WC][2] = values[CMG3];     cand_bonus_mg[BC][5] = values[CMG3];
	cand_bonus_mg[WC][3] = values[CMG4];     cand_bonus_mg[BC][4] = values[CMG4];
	cand_bonus_mg[WC][4] = values[CMG5];     cand_bonus_mg[BC][3] = values[CMG5];
	cand_bonus_mg[WC][5] = values[CMG6];     cand_bonus_mg[BC][2] = values[CMG6];
	cand_bonus_mg[WC][6] = values[CMG7];     cand_bonus_mg[BC][1] = values[CMG7];
	cand_bonus_mg[WC][7] = 0;                cand_bonus_mg[BC][0] = 0;

	cand_bonus_eg[WC][0] = 0;                cand_bonus_eg[BC][7] = 0;
	cand_bonus_eg[WC][1] = values[CEG2];     cand_bonus_eg[BC][6] = values[CEG2];
	cand_bonus_eg[WC][2] = values[CEG3];     cand_bonus_eg[BC][5] = values[CEG3];
	cand_bonus_eg[WC][3] = values[CEG4];     cand_bonus_eg[BC][4] = values[CEG4];
	cand_bonus_eg[WC][4] = values[CEG5];     cand_bonus_eg[BC][3] = values[CEG5];
	cand_bonus_eg[WC][5] = values[CEG6];     cand_bonus_eg[BC][2] = values[CEG6];
	cand_bonus_eg[WC][6] = values[CEG7];     cand_bonus_eg[BC][1] = values[CEG7];
	cand_bonus_eg[WC][7] = 0;                cand_bonus_eg[BC][0] = 0;
}

void cParam::InitBackward() {

    // add file-dependent component to backward pawns penalty
    // (assuming backward pawns on central files are bigger liability)

    backward_malus_mg[FILE_A] = values[BK_MID] + 3;
    backward_malus_mg[FILE_B] = values[BK_MID] + 1;
    backward_malus_mg[FILE_C] = values[BK_MID] - 1;
    backward_malus_mg[FILE_D] = values[BK_MID] - 3;
    backward_malus_mg[FILE_E] = values[BK_MID] - 3;
    backward_malus_mg[FILE_F] = values[BK_MID] - 1;
    backward_malus_mg[FILE_G] = values[BK_MID] + 1;
    backward_malus_mg[FILE_H] = values[BK_MID] + 3;
}

void cParam::InitPst() {

    for (int sq = 0; sq < 64; sq++) {
        for (eColor sd = WC; sd < 2; ++sd) {

            mg_pst[sd][P][REL_SQ(sq, sd)] = ((values[P_MID] * Par.values[W_MATERIAL]) / 100) + (pstPawnMg  [sq] * Par.values[W_PST]) / 100;
            eg_pst[sd][P][REL_SQ(sq, sd)] = ((values[P_END] * Par.values[W_MATERIAL]) / 100) + (pstPawnEg  [sq] * Par.values[W_PST]) / 100;
            mg_pst[sd][N][REL_SQ(sq, sd)] = ((values[N_MID] * Par.values[W_MATERIAL]) / 100) + (pstKnightMg[sq] * Par.values[W_PST]) / 100;
            eg_pst[sd][N][REL_SQ(sq, sd)] = ((values[N_END] * Par.values[W_MATERIAL]) / 100) + (pstKnightEg[sq] * Par.values[W_PST]) / 100;
            mg_pst[sd][B][REL_SQ(sq, sd)] = ((values[B_MID] * Par.values[W_MATERIAL]) / 100) + (pstBishopMg[sq] * Par.values[W_PST]) / 100;
            eg_pst[sd][B][REL_SQ(sq, sd)] = ((values[B_END] * Par.values[W_MATERIAL]) / 100) + (pstBishopEg[sq] * Par.values[W_PST]) / 100;
            mg_pst[sd][R][REL_SQ(sq, sd)] = ((values[R_MID] * Par.values[W_MATERIAL]) / 100) + (pstRookMg  [sq] * Par.values[W_PST]) / 100;
            eg_pst[sd][R][REL_SQ(sq, sd)] = ((values[R_END] * Par.values[W_MATERIAL]) / 100) + (pstRookEg  [sq] * Par.values[W_PST]) / 100;
            mg_pst[sd][Q][REL_SQ(sq, sd)] = ((values[Q_MID] * Par.values[W_MATERIAL]) / 100) + (pstQueenMg [sq] * Par.values[W_PST]) / 100;
            eg_pst[sd][Q][REL_SQ(sq, sd)] = ((values[Q_END] * Par.values[W_MATERIAL]) / 100) + (pstQueenEg [sq] * Par.values[W_PST]) / 100;
            mg_pst[sd][K][REL_SQ(sq, sd)] = (pstKingMg [sq] * Par.values[W_PST]) / 100;
            eg_pst[sd][K][REL_SQ(sq, sd)] = (pstKingEg [sq] * Par.values[W_PST]) / 100;

            sp_pst[sd][N][REL_SQ(sq, sd)] = pstKnightOutpost[sq];
            sp_pst[sd][B][REL_SQ(sq, sd)] = pstBishopOutpost[sq];
            sp_pst[sd][DEF_MG][REL_SQ(sq, sd)] = pstDefendedPawnMg[sq];
            sp_pst[sd][PHA_MG][REL_SQ(sq, sd)] = pstPhalanxPawnMg[sq];
            sp_pst[sd][DEF_EG][REL_SQ(sq, sd)] = pstDefendedPawnEg[sq];
            sp_pst[sd][PHA_EG][REL_SQ(sq, sd)] = pstPhalanxPawnEg[sq];
        }
    }
}

void cParam::InitMobility() {

    for (int i = 0; i < 9; i++) {
        n_mob_mg[i] = 4 * (i - 4); 
        n_mob_eg[i] = 4 * (i - 4);
    }

    for (int i = 0; i < 14; i++) {
        b_mob_mg[i] = 5 * (i - 6);
        b_mob_eg[i] = 5 * (i - 6);
    }

    for (int i = 0; i < 15; i++) {
        r_mob_mg[i] = 2 * (i - 7);
        r_mob_eg[i] = 4 * (i - 7);
    }

    // one day queen mobility will be Texel-tuned too

    for (int i = 0; i < 28; i++) {
		q_mob_mg[i] = 1 * (i - 14);
        q_mob_eg[i] = 2 * (i - 14);
    }

}

void cParam::InitMaterialTweaks() {

    // Init tables for adjusting piece values
    // according to the number of own pawns

    for (int i = 0; i < 9; i++) {
        np_table[i] = adj[i] * values[N_CL];
        rp_table[i] = adj[i] * values[R_OP];
    }

    // Init imbalance table, so that we can expose option for exchange delta

    for (int i = 0; i < 9; i++) {
        for (int j = 0; j < 9; j++) {

            // insert original values

            imbalance[i][j] = imbalance_data[i][j];

            // insert value defined in Par.values

            if (imbalance_data[i][j] == A_EXC) imbalance[i][j] = values[A_EXC];
            else if (imbalance_data[i][j] == -A_EXC) imbalance[i][j] = -values[A_EXC];
            else if (imbalance_data[i][j] == A_MIN) imbalance[i][j] = values[A_MIN];
            else if (imbalance_data[i][j] == -A_MIN) imbalance[i][j] = -values[A_MIN];
            else if (imbalance_data[i][j] == A_MAJ) imbalance[i][j] = values[A_MAJ];
            else if (imbalance_data[i][j] == -A_MAJ) imbalance[i][j] = -values[A_MAJ];
            else if (imbalance_data[i][j] == A_TWO) imbalance[i][j] = values[A_TWO];
            else if (imbalance_data[i][j] == -A_TWO) imbalance[i][j] = -values[A_TWO];
            else if (imbalance_data[i][j] == A_ALL) imbalance[i][j] = values[A_ALL];
            else if (imbalance_data[i][j] == -A_ALL) imbalance[i][j] = -values[A_ALL];
        }
    }
}

void cParam::InitTables() {

    // Init king attack table

    for (int t = 0, i = 1; i < 511; ++i) {
        t = (int)Min(1280.0, Min((0.027 * i * i), t + 8.0));
        danger[i] = (t * 100) / 256; // rescale to centipawns
    }
}

void cParam::SetSpeed(int elo_in) {
    nps_limit = 0;
    eval_blur = 0;

    if (fl_weakening) {
        nps_limit = EloToSpeed(elo_in);
        eval_blur = EloToBlur(elo_in);
        book_depth = SpeedToBookDepth(nps_limit);
    }
}

int cParam::EloToSpeed(int elo_in) {

    // This formula abuses Michael Byrne's code from CraftySkill.
    // He used  it to calculate max nodes per elo. By  dividing,
    // I derive speed that yields similar result in standard blitz.
    // Formula has a little bit of built-in randomness.

    const int lower_elo = elo_in - 25;
    const int upper_elo = elo_in + 25;
    int use_rating = rand() % (upper_elo - lower_elo + 1) + lower_elo;
    int search_nodes = (int)(pow(1.0069555500567, (((use_rating) / 1200) - 1)
                             + (use_rating - 1200)) * 128);

    return (search_nodes / 7) + (elo / 60);
}

int cParam::EloToBlur(int elo_in) {

    // Weaker levels get their evaluation blurred

    if (elo_in < 1500) return (1500 - elo_in) / 4;
    return 0;
}

int cParam::SpeedToBookDepth(int nps) {

	if (nps == 0 || nps > 100000) return 256;

	return (int) (nps * 256) / 100000;
}

void cDistance::Init() {

    // Init distance tables

    for (int sq1 = 0; sq1 < 64; ++sq1) {
        for (int sq2 = 0; sq2 < 64; ++sq2) {
            int r_delta = Abs(Rank(sq1) - Rank(sq2));
            int f_delta = Abs(File(sq1) - File(sq2));
            bonus[sq1][sq2] = 14 - (r_delta + f_delta);  // for king tropism evaluation
            metric[sq1][sq2] = Max(r_delta, f_delta);    // chebyshev distance for unstoppable passers
        }
    }
}

void cParam::SetVal(int slot, int val, int min, int max, bool tune) {

    values[slot] = val;
    min_val[slot] = min;
    max_val[slot] = max;
    tunable[slot] = tune;
    if (val < min || val > max)
        printf("%14s ERROR\n", paramNames[slot]);
}

void cParam::PrintValues() {

    int iter = 0;

    printf("\n\n");
    for (int i = 0; i < N_OF_VAL; ++i) {
        if (tunable[i] == true) {
            printf("%14s : %4d     ", paramNames[i], Par.values[i]);
            iter++;
            if (iter % 4 == 0) printf("\n");
        }
    }
    printf("\n\n");
}