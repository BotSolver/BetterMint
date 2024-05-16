/*
Rodent, a UCI chess playing engine derived from Sungorus 1.4
Copyright (C) 2009-2011 Pablo Vazquez (Sungorus author)
Copyright (C) 2011-2017 Pawel Koziol

Rodent is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published
by the Free Software Foundation, either version 3 of the License,
or (at your option) any later version.

Rodent is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty
of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

#include "rodent.h"
#include <cstdio>
#include <cstdlib>
#include <cstring>

void sInternalBook::Init() {

    #include "book_internal.h"

    n_of_records = 0; // clear any preexisting internal book

    for (int i = 0; wbook[i]; ++i) {
        if (LineToInternal(wbook[i], BC)) { printf("White book error: %s\n", wbook[i]); };
    }

	for (int i = 0; bbook[i]; ++i) {
		if (LineToInternal(bbook[i], WC)) { printf("Black book error: %s\n", bbook[i]); };
	}

    for (int i = 0; i < n_of_records; i++) // get rid of really bad moves
        if (!(internal_book[i].freq > 0)) {
            memmove(&internal_book[i], &internal_book[i+1], (n_of_records - i - 1) * sizeof(internal_book[0]));
            n_of_records--; i--;
        }

    qsort(internal_book, n_of_records, sizeof(sBookEntry), [](const void *a, const void *b) {
        const U64 a64 = ((sBookEntry *)a)->hash;
        const U64 b64 = ((sBookEntry *)b)->hash;
        if (a64 > b64) return 1;
        if (a64 < b64) return -1;
        const int afreq = ((sBookEntry *)a)->freq;
        const int bfreq = ((sBookEntry *)b)->freq;
        return bfreq - afreq;
    });
	
    if (Par.verbose_book) printf("info string %d moves loaded from the internal book\n", n_of_records);

}

//#ifndef USEGEN
bool sInternalBook::LineToInternal(const char *ptr, int excludedColor) {

    char token[512];
    POS p[1];
    int move, freq;

    p->SetPosition(START_POS);

    for (;;) {
        ptr = ParseToken(ptr, token);

        if (*token == '\0') break;

        move = p->StrToMove(token);

        if (p->Legal(move)) {
            // apply move frequency modifiers
            freq = 1;
            if (strchr(token, '?'))  freq = -100;
            if (strchr(token, '!'))  freq = +100;
            if (strstr(token, "??")) freq = -4900;
            if (strstr(token, "!!")) freq = +900;

            // add move to book if we accept moves of a given color
            if (p->mSide != excludedColor)
                MoveToInternal(p->mHashKey, move, freq);

            p->DoMove(move);
        } else { return true; }

        if (p->mRevMoves == 0)
            p->mHead = 0;
    }
    return false;
}

void sInternalBook::MoveToInternal(U64 hashKey, int move, int val) {

    // if move is already in the book, just change its frequency

    for (int i = 0; i < n_of_records; i++) {
        if (internal_book[i].hash == hashKey
        &&  internal_book[i].move == move) {
            internal_book[i].freq += val;
            return;
        }
    }

    // otherwise save it in the last slot

    internal_book[n_of_records].hash = hashKey;
    internal_book[n_of_records].move = move;
    internal_book[n_of_records].freq = val;
    n_of_records++;
}
//#endif

int sInternalBook::MoveFromInternal(POS *p, bool print_output) const {

    if (Par.verbose_book) printf("info string probing the internal book...\n");

    int choice = 0;

    const int min_freq = 20; // the higher this value, the more uniform move distribution

    int left = 0, right = n_of_records - 1;

    while (left < right) { // binary search for the leftmost value
        int mid = (left + right) / 2;

        if (p->mHashKey <= internal_book[mid].hash) right = mid;
        else                                        left = mid + 1;
    }

    int vals_acc = 0;

    for (int i = left; i < n_of_records && internal_book[i].hash == p->mHashKey; i++) {
        if (p->Legal(internal_book[i].move)) {

            const int freq_with_correction = internal_book[i].freq + min_freq;

            // display info about book moves
            if (print_output) {
                printf("info string %s %d\n", MoveToStr(internal_book[i].move), freq_with_correction);
            }

            // pick move with the best random value based on frequency
            vals_acc += freq_with_correction;
            if (my_random(vals_acc) < freq_with_correction) choice = internal_book[i].move;
        }
    }

    return choice;
}
