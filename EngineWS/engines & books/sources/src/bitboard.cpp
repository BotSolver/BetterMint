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
#include "magicmoves.h"
#include <cstdio>

void PrintBb(U64 bbTest) {

    for (int sq = 0; sq < 64; sq++) {
        if (bbTest & SqBb(sq ^ 56)) printf("+ ");
        else                        printf(". ");
        if ((sq + 1) % 8 == 0) printf(" %d\n", 9 - ((sq + 1) / 8));
    }
    printf("\na b c d e f g h\n");
}

void cBitBoard::Init() {

#ifdef USE_MAGIC
    initmagicmoves();
#endif

    // init pawn attacks

    for (int sq = 0; sq < 64; sq++) {
        p_attacks[WC][sq] = ShiftNE(SqBb(sq)) | ShiftNW(SqBb(sq));
        p_attacks[BC][sq] = ShiftSE(SqBb(sq)) | ShiftSW(SqBb(sq));
    }

    // init knight attacks

    for (int sq = 0; sq < 64; sq++) {
        U64 bb_west = ShiftWest(SqBb(sq));
        U64 bb_east = ShiftEast(SqBb(sq));
        n_attacks[sq] = (bb_east | bb_west) << 16;
        n_attacks[sq] |= (bb_east | bb_west) >> 16;
        bb_west = ShiftWest(bb_west);
        bb_east = ShiftEast(bb_east);
        n_attacks[sq] |= (bb_east | bb_west) << 8;
        n_attacks[sq] |= (bb_east | bb_west) >> 8;
    }

    // init king attacks

    for (int sq = 0; sq < 64; sq++) {
        k_attacks[sq] = SqBb(sq);
        k_attacks[sq] |= ShiftSideways(k_attacks[sq]);
        k_attacks[sq] |= (ShiftNorth(k_attacks[sq]) | ShiftSouth(k_attacks[sq]));
    }

    // init table of rays between squares

    for (int sq1 = 0; sq1 < 64; sq1++) {
        for (int sq2 = 0; sq2 < 64; sq2++) {
            bbBetween[sq1][sq2] = GetBetween(sq1, sq2);
        }
    }

}

// from Laser, originally from chessprogramming wiki

U64 cBitBoard::GetBetween(int sq1, int sq2) {

    #pragma warning( suppress : 4146 )
    const U64 m1 = C64(-1);
    const U64 a2a7 = C64(0x0001010101010100);
    const U64 b2g7 = C64(0x0040201008040200);
    const U64 h1b7 = C64(0x0002040810204080); /* Thanks Dustin, g2b7 did not work for c1-a3 */
    U64 btwn, line, rank, file;

    btwn = (m1 << sq1) ^ (m1 << sq2);
    file = (sq2 & 7) - (sq1 & 7);
    rank = ((sq2 | 7) - sq1) >> 3;
    line = ((file & 7) - 1) & a2a7; /* a2a7 if same file */
    line += 2 * (((rank & 7) - 1) >> 58); /* b1g1 if same rank */
    line += (((rank - file) & 15) - 1) & b2g7; /* b2g7 if same diagonal */
    line += (((rank + file) & 15) - 1) & h1b7; /* h1b7 if same antidiag */
    #pragma warning( suppress : 4146 )
    line *= btwn & -btwn; /* mul acts like shift by smaller square */
    return line & btwn;   /* return the bits on that line in-between */
}

#if defined(__GNUC__)

#if defined(__SSSE3__) && !defined(__POPCNT__) // only for ssse3 targets
    #include "popcnt_ssse3.h"
    #define popcnt_gcc(x) popcnt_ssse3(x)
#else
    #define popcnt_gcc(x) __builtin_popcountll(x)
#endif

int cBitBoard::PopCnt(U64 bb) {
    return popcnt_gcc(bb);
}

#elif defined(USE_MM_POPCNT)
    #include <nmmintrin.h>
    #ifndef _M_AMD64 // 32 bit windows
        int cBitBoard::PopCnt(U64 bb) {
            return _mm_popcnt_u32((unsigned int)(bb >> 32)) + _mm_popcnt_u32((unsigned int)(bb));
        }
    #else            // 64 bit windows
        int cBitBoard::PopCnt(U64 bb) {
            return (int)_mm_popcnt_u64(bb);
        }
    #endif
#else

int cBitBoard::PopCnt(U64 bb) { // general purpose population count

    U64 k1 = (U64)0x5555555555555555;
    U64 k2 = (U64)0x3333333333333333;
    U64 k3 = (U64)0x0F0F0F0F0F0F0F0F;
    U64 k4 = (U64)0x0101010101010101;

    bb -= (bb >> 1) & k1;
    bb = (bb & k2) + ((bb >> 2) & k2);
    bb = (bb + (bb >> 4)) & k3;
    return (bb * k4) >> 56;
}

#endif

int cBitBoard::PopFirstBit(U64 *bb) {

    U64 bb_local = *bb;
    *bb &= (*bb - 1);
    return FirstOne(bb_local);
}

U64 cBitBoard::FillNorth(U64 bb) {
    bb |= bb << 8;
    bb |= bb << 16;
    bb |= bb << 32;
    return bb;
}

U64 cBitBoard::FillSouth(U64 bb) {
    bb |= bb >> 8;
    bb |= bb >> 16;
    bb |= bb >> 32;
    return bb;
}

U64 cBitBoard::FillNorthExcl(U64 bb) {
    return FillNorth(ShiftNorth(bb));
}

U64 cBitBoard::FillSouthExcl(U64 bb) {
    return FillSouth(ShiftSouth(bb));
}

U64 cBitBoard::FillNorthSq(int sq) {
    return FillNorth(SqBb(sq));
}

U64 cBitBoard::FillSouthSq(int sq) {
    return FillSouth(SqBb(sq));
}

U64 cBitBoard::GetWPControl(U64 bb) {
    return (ShiftNE(bb) | ShiftNW(bb));
}

U64 cBitBoard::GetBPControl(U64 bb) {
    return (ShiftSE(bb) | ShiftSW(bb));
}

U64 cBitBoard::GetPawnControl(U64 bb, eColor sd) {
    if (sd == WC) return GetWPControl(bb);
    else          return GetBPControl(bb);
}

U64 cBitBoard::GetDoubleWPControl(U64 bb) {
    return (ShiftNE(bb) & ShiftNW(bb));
}

U64 cBitBoard::GetDoubleBPControl(U64 bb) {
    return (ShiftSE(bb) & ShiftSW(bb));
}

U64 cBitBoard::GetFrontSpan(U64 bb, eColor sd) {

    if (sd == WC) return BB.FillNorthExcl(bb);
    else          return BB.FillSouthExcl(bb);
}

U64 cBitBoard::ShiftFwd(U64 bb, eColor sd) {

    if (sd == WC) return ShiftNorth(bb);
    else          return ShiftSouth(bb);
}

U64 cBitBoard::ShiftSideways(U64 bb) {
    return (ShiftWest(bb) | ShiftEast(bb));
}

U64 cBitBoard::PawnAttacks(eColor sd, int sq) {
    return p_attacks[sd][sq];
}

#ifndef USE_MAGIC

U64 cBitBoard::FillOcclSouth(U64 bb_start, U64 bb_block) {

    bb_start |= bb_block & (bb_start >> 8);
    bb_block &= (bb_block >> 8);
    bb_start |= bb_block & (bb_start >> 16);
    bb_block &= (bb_block >> 16);
    bb_start |= bb_block & (bb_start >> 32);
    return bb_start;
}

U64 cBitBoard::FillOcclNorth(U64 bb_start, U64 bb_block) {

    bb_start |= bb_block & (bb_start << 8);
    bb_block &= (bb_block << 8);
    bb_start |= bb_block & (bb_start << 16);
    bb_block &= (bb_block << 16);
    bb_start |= bb_block & (bb_start << 32);
    return bb_start;
}

U64 cBitBoard::FillOcclEast(U64 bb_start, U64 bb_block) {

    bb_block &= bbNotA;
    bb_start |= bb_block & (bb_start << 1);
    bb_block &= (bb_block << 1);
    bb_start |= bb_block & (bb_start << 2);
    bb_block &= (bb_block << 2);
    bb_start |= bb_block & (bb_start << 4);
    return bb_start;
}

U64 cBitBoard::FillOcclNE(U64 bb_start, U64 bb_block) {

    bb_block &= bbNotA;
    bb_start |= bb_block & (bb_start << 9);
    bb_block &= (bb_block << 9);
    bb_start |= bb_block & (bb_start << 18);
    bb_block &= (bb_block << 18);
    bb_start |= bb_block & (bb_start << 36);
    return bb_start;
}

U64 cBitBoard::FillOcclSE(U64 bb_start, U64 bb_block) {

    bb_block &= bbNotA;
    bb_start |= bb_block & (bb_start >> 7);
    bb_block &= (bb_block >> 7);
    bb_start |= bb_block & (bb_start >> 14);
    bb_block &= (bb_block >> 14);
    bb_start |= bb_block & (bb_start >> 28);
    return bb_start;
}

U64 cBitBoard::FillOcclWest(U64 bb_start, U64 bb_block) {

    bb_block &= bbNotH;
    bb_start |= bb_block & (bb_start >> 1);
    bb_block &= (bb_block >> 1);
    bb_start |= bb_block & (bb_start >> 2);
    bb_block &= (bb_block >> 2);
    bb_start |= bb_block & (bb_start >> 4);
    return bb_start;
}

U64 cBitBoard::FillOcclSW(U64 bb_start, U64 bb_block) {

    bb_block &= bbNotH;
    bb_start |= bb_block & (bb_start >> 9);
    bb_block &= (bb_block >> 9);
    bb_start |= bb_block & (bb_start >> 18);
    bb_block &= (bb_block >> 18);
    bb_start |= bb_block & (bb_start >> 36);
    return bb_start;
}

U64 cBitBoard::FillOcclNW(U64 bb_start, U64 bb_block) {

    bb_block &= bbNotH;
    bb_start |= bb_block & (bb_start << 7);
    bb_block &= (bb_block << 7);
    bb_start |= bb_block & (bb_start << 14);
    bb_block &= (bb_block << 14);
    bb_start |= bb_block & (bb_start << 28);
    return bb_start;
}

#endif

U64 cBitBoard::KnightAttacks(int sq) {
    return n_attacks[sq];
}

U64 cBitBoard::RookAttacks(U64 bb_occ, int sq) {

#ifdef USE_MAGIC
    return Rmagic(sq, bb_occ);
#else
    U64 bb_start = SqBb(sq);
    U64 result = ShiftNorth(FillOcclNorth(bb_start, ~bb_occ))
                 | ShiftSouth(FillOcclSouth(bb_start, ~bb_occ))
                 | ShiftEast(FillOcclEast(bb_start, ~bb_occ))
                 | ShiftWest(FillOcclWest(bb_start, ~bb_occ));
    return result;
#endif
}

U64 cBitBoard::BishAttacks(U64 bb_occ, int sq) {
#ifdef USE_MAGIC
    return Bmagic(sq, bb_occ);
#else
    U64 bb_start = SqBb(sq);
    U64 result = ShiftNE(FillOcclNE(bb_start, ~bb_occ))
                 | ShiftNW(FillOcclNW(bb_start, ~bb_occ))
                 | ShiftSE(FillOcclSE(bb_start, ~bb_occ))
                 | ShiftSW(FillOcclSW(bb_start, ~bb_occ));
    return result;
#endif
}

U64 cBitBoard::QueenAttacks(U64 bb_occ, int sq) {

#ifdef USE_MAGIC
    return Rmagic(sq, bb_occ) | Bmagic(sq, bb_occ);
#else
    return RookAttacks(bb_occ, sq) | BishAttacks(bb_occ, sq);
#endif
}

U64 cBitBoard::KingAttacks(int sq) {
    return k_attacks[sq];
}

void cBitBoard::Print(U64 bb) {

    for (int sq = 0; sq < 64; sq++) {
        if (bb & RelSqBb(sq, BC)) printf("+ ");
        else                      printf(". ");
        if ((sq + 1) % 8 == 0) printf(" %d\n", 9 - ((sq + 1) / 8));
    }
    printf("\na b c d e f g h\n");
}
