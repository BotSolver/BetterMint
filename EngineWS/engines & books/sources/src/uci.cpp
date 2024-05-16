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
#include "book.h"
#include <cstdio>
#include <cstdlib>
#include <cstring>

#ifdef USE_THREADS
    #include <thread>
    using namespace std::literals::chrono_literals;
#endif

#if defined(_WIN32) || defined(_WIN64)
    #define WINDOWS_BUILD
#else
    #include <unistd.h>
#endif

void ReadLine(char *str, int n) {

    char *ptr;

    if (fgets(str, n, stdin) == NULL)
        exit(0);
    if ((ptr = strchr(str, '\n')) != NULL)
        *ptr = '\0';
}

const char *ParseToken(const char *string, char *token) {

    while (*string == ' ')
        string++;
    while (*string != ' ' && *string != '\0')
        *token++ = *string++;
    *token = '\0';
    return string;
}

void UciLoop() {

    char command[4096], token[80]; const char *ptr;
    POS p[1];

    setbuf(stdin, NULL);
    setbuf(stdout, NULL);
    p->SetPosition(START_POS);
    Trans.AllocTrans(16);
    for (;;) {
        ReadLine(command, sizeof(command));
        ptr = ParseToken(command, token);

        if (strcmp(token, "uci") == 0)               {

            PrintVersion();

            Glob.is_console = false;
            printf("id author Pawel Koziol (based on Sungorus 1.4 by Pablo Vazquez)\n");
            PrintOverrides();
            PrintUciOptions();
            printf("uciok\n");
        } else if (strcmp(token, "ucinewgame") == 0) {
            Trans.Clear();
            Glob.ClearData();
            p->SetPosition(START_POS);
            srand(GetMS());
            Glob.game_key = p->Random64() ^ (U64) GetMS(); // so that the weakest personalities do not repeat the same game
        } else if (strcmp(token, "isready") == 0)    {
            printf("readyok\n");
        } else if (strcmp(token, "setoption") == 0)  {
            ParseSetoption(ptr);
        } else if (strcmp(token, "so") == 0)         {
            ParseSetoption(ptr);
        } else if (strcmp(token, "position") == 0)   {
            p->ParsePosition(ptr);
        } else if (strcmp(token, "go") == 0)         {
            ParseGo(p, ptr);
        } else if (strcmp(token, "print") == 0)      {
            p->PrintBoard();
        } else if (strcmp(token, "step") == 0)       {
            p->ParseMoves(ptr);
        } else if (strcmp(token, "stepp") == 0)      {
            p->ParseMoves(ptr);
            p->PrintBoard();
        } else if (strcmp(token, "bench") == 0)      {
            ptr = ParseToken(ptr, token);
#ifndef USE_THREADS
            EngineSingle.Bench(atoi(token));
#else
            Engines.front().Bench(atoi(token));
#endif
        } else if (strcmp(token, "quit") == 0)       {
            exit(0);
        }
    }
}

void POS::ParseMoves(const char *ptr) {

    char token[180];

    for (;;) {

        // Get next move to parse

        ptr = ParseToken(ptr, token);

        // No more moves!

        if (*token == '\0') break;

        const int move = StrToMove(token);
        if (Legal(move)) {
            DoMove(move);
            Glob.moves_from_start++;
        }
        else printf("info string illegal move\n");

        // We won't be taking back moves beyond this point:

        if (mRevMoves == 0) mHead = 0;
    }
}

void POS::ParsePosition(const char *ptr) {

    char token[80], fen[80];

    ptr = ParseToken(ptr, token);
    if (strcmp(token, "fen") == 0) {
        fen[0] = '\0';
        for (;;) {
            ptr = ParseToken(ptr, token);
            if (*token == '\0' || strcmp(token, "moves") == 0)
                break;
            strcat(fen, token);
            strcat(fen, " ");
        }
        SetPosition(fen);
    } else {
        ptr = ParseToken(ptr, token);
        SetPosition(START_POS);
    }
    if (strcmp(token, "moves") == 0)
        ParseMoves(ptr);
}

int cEngine::BulletCorrection(int time) {

    if (time < 200)       return (time * 23) / 32;
    else if (time <  400) return (time * 26) / 32;
    else if (time < 1200) return (time * 29) / 32;
    else return time;
}

void ExtractMove(int *pv) {

    char bestmove_str[6], ponder_str[6];

    MoveToStr(pv[0], bestmove_str);
    if (pv[1]) {
        MoveToStr(pv[1], ponder_str);
        printf("bestmove %s ponder %s\n", bestmove_str, ponder_str);
    } else
        printf("bestmove %s\n", bestmove_str);
}

void cEngine::SetMoveTime(int base, int inc, int movestogo) {

    if (base >= 0) {

        if (movestogo == 1) base -= Min(1000, base / 10);
        msMoveTime = (base + inc * (movestogo - 1)) / movestogo;

        // make a percentage correction to playing speed (unless too risky)

        if (2 * msMoveTime > base) {
            msMoveTime *= Par.time_percentage;
            msMoveTime /= 100;
        }

        // ensure that our limit does not exceed total time available

        if (msMoveTime > base) msMoveTime = base;

        // safeguard against a lag

        msMoveTime -= Glob.time_buffer;

        // ensure that we have non-negative time

        if (msMoveTime < 0) msMoveTime = 0;

        // assign less time per move on extremely short time controls

        msMoveTime = BulletCorrection(msMoveTime);
    }
}

void ParseGo(POS *p, const char *ptr) {

    char token[80];

    int wtime = -1, btime = -1;
    int winc  =  0, binc  =  0;
    int movestogo = 40;
    bool strict_time = false;
    Glob.pondering = false;

	// We may assume that when the engine can think on opponent's time,
	// it can afford to use more time to think. Unfortunately, this fails
	// with the current time management scheme.

	// if (Par.use_ponder) movestogo = 38;

    cEngine::msMoveTime    = -1;
    cEngine::msMoveNodes   =  0;
    cEngine::msSearchDepth = 64;

    Par.shut_up = false;

    for (;;) {
        ptr = ParseToken(ptr, token);
        if (*token == '\0')
            break;
        if (strcmp(token, "ponder") == 0)           {
            Glob.pondering = true;
        } else if (strcmp(token, "depth") == 0)     {
            ptr = ParseToken(ptr, token);
            cEngine::msSearchDepth = atoi(token);
            strict_time = true;
        } else if (strcmp(token, "movetime") == 0)  {
            ptr = ParseToken(ptr, token);
            cEngine::msMoveTime = atoi(token);
            strict_time = true;
        } else if (strcmp(token, "nodes") == 0)     {
            ptr = ParseToken(ptr, token);
            cEngine::msMoveNodes = atoi(token);
            cEngine::msMoveTime = 99999999;
            strict_time = true;
        } else if (strcmp(token, "wtime") == 0)     {
            ptr = ParseToken(ptr, token);
            wtime = atoi(token);
        } else if (strcmp(token, "btime") == 0)     {
            ptr = ParseToken(ptr, token);
            btime = atoi(token);
        } else if (strcmp(token, "winc") == 0)      {
            ptr = ParseToken(ptr, token);
            winc = atoi(token);
        } else if (strcmp(token, "binc") == 0)      {
            ptr = ParseToken(ptr, token);
            binc = atoi(token);
        } else if (strcmp(token, "movestogo") == 0) {
            ptr = ParseToken(ptr, token);
            movestogo = atoi(token);
        }
    }

    // set move time

    if (!strict_time) {
        int base = p->mSide == WC ? wtime : btime;
        int inc  = p->mSide == WC ? winc  : binc;
        cEngine::SetMoveTime(base, inc, movestogo);
    }

    // set global variables

    cEngine::msStartTime = GetMS();
    Trans.tt_date = (Trans.tt_date + 1) & 255;
    Glob.nodes = 0;
    Glob.abort_search = false;
    Glob.depth_reached = 0;
    if (Glob.should_clear)
        Glob.ClearData(); // options has been changed and old tt scores are no longer reliable
    Par.InitAsymmetric(p);

    // get book move

    if (Par.use_book) {

		int pvb = 0;

        if (Par.book_depth >= Glob.moves_from_start) {
			if (!pvb) pvb = InternalBook.MoveFromInternal(p, Par.verbose_book);
            if (!pvb) pvb = MainBook.GetPolyglotMove(p, Par.verbose_book);
        }

        if (pvb) {
            printf("bestmove %s\n", MoveToStr(pvb));
            return;
        }
    }

    if (Glob.multiPv > 1) {

        int pv[MAX_PLY];

#ifndef USE_THREADS
        EngineSingle.MultiPv(p, pv);
#else
        Engines.front().MultiPv(p, pv);
#endif

        if (Glob.goodbye)
            exit(0);
    }

	if (Glob.multiPv == 1) {

		// Set engine-dependent variables and search using the designated number of threads

#ifndef USE_THREADS
		EngineSingle.mDpCompleted = 0;
		EngineSingle.Think(p);
		ExtractMove(EngineSingle.mPvEng);
#else
		Glob.goodbye = false;

		for (auto& engine : Engines) // mDpCompleted cleared in StartThinkThread();
			engine.StartThinkThread(p);

		std::thread timer([] {
			while (Glob.abort_search == false) {

				// Check for timeout every 5 milliseconds. This allows Rodent
				// to survive extreme time controls, like 1 s + 10 ms

				std::this_thread::sleep_for(5ms);
				CheckTimeout();
			}
		});

		for (auto& engine : Engines)
			engine.WaitThinkThread();

		timer.join();

		if (Glob.goodbye)
			exit(0);

		int *best_pv, best_depth = -1;

		for (auto& engine : Engines)
			if (best_depth < engine.mDpCompleted) {
				best_depth = engine.mDpCompleted;
				best_pv = engine.mPvEng;
			}

		ExtractMove(best_pv);
#endif
	}

    }

void cEngine::Bench(int depth) {

    POS p[1];
    int pv[MAX_PLY];
    const char *test[] = {
        "r1bqkbnr/pp1ppppp/2n5/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq -",       // 1.e4 c5 2.Nf3 Nc6
        "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -",   // multiple captures
        "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - -",                              // rook endgame
        "4rrk1/pp1n3p/3q2pQ/2p1pb2/2PP4/2P3N1/P2B2PP/4RRK1 b - - 7 19",
        "rq3rk1/ppp2ppp/1bnpb3/3N2B1/3NP3/7P/PPPQ1PP1/2KR3R w - - 7 14",      // knight pseudo-sack
        "r1bq1r1k/1pp1n1pp/1p1p4/4p2Q/4Pp2/1BNP4/PPP2PPP/3R1RK1 w - - 2 14",  // pawn chain
        "r3r1k1/2p2ppp/p1p1bn2/8/1q2P3/2NPQN2/PPP3PP/R4RK1 b - - 2 15",
        "r1bbk1nr/pp3p1p/2n5/1N4p1/2Np1B2/8/PPP2PPP/2KR1B1R w kq - 0 13",
        "r1bq1rk1/ppp1nppp/4n3/3p3Q/3P4/1BP1B3/PP1N2PP/R4RK1 w - - 1 16",     // attack for pawn
        "4r1k1/r1q2ppp/ppp2n2/4P3/5Rb1/1N1BQ3/PPP3PP/R5K1 w - - 1 17",        // exchange sack
        "2rqkb1r/ppp2p2/2npb1p1/1N1Nn2p/2P1PP2/8/PP2B1PP/R1BQK2R b KQ - 0 11",
        "r1bq1r1k/b1p1npp1/p2p3p/1p6/3PP3/1B2NN2/PP3PPP/R2Q1RK1 w - - 1 16",  // white pawn center
        "3r1rk1/p5pp/bpp1pp2/8/q1PP1P2/b3P3/P2NQRPP/1R2B1K1 b - - 6 22",
        "r1q2rk1/2p1bppp/2Pp4/p6b/Q1PNp3/4B3/PP1R1PPP/2K4R w - - 2 18",
        "4k2r/1pb2ppp/1p2p3/1R1p4/3P4/2r1PN2/P4PPP/1R4K1 b - - 3 22",         // endgame
        "3q2k1/pb3p1p/4pbp1/2r5/PpN2N2/1P2P2P/5PP1/Q2R2K1 b - - 4 26",        // both queens en prise
        NULL
    }; // test positions taken from DiscoCheck by Lucas Braesch

    if (depth == 0) depth = 8; // so that you can call bench without parameters
    Trans.Clear();
    ClearAll();
    mDpCompleted = 0; // maybe move to ClearAll()?
    Par.shut_up = true;

    printf("Bench test started (depth %d): \n", depth);

    Glob.nodes = 0;
    Glob.abort_search = false;
    msStartTime = GetMS();
    msSearchDepth = depth;

    // search each position to desired depth

    for (int i = 0; test[i]; ++i) {
        printf("%s\n", test[i]);
        p->SetPosition(test[i]);
        Par.InitAsymmetric(p);
        Glob.depth_reached = 0;
        Iterate(p, pv);
    }

    // calculate and print statistics

    int end_time = GetMS() - msStartTime;
    unsigned int nps = (unsigned int)((Glob.nodes * 1000) / (end_time + 1));

    printf("%" PRIu64 " nodes searched in %d, speed %u nps (Score: %.3f)\n", (U64)Glob.nodes, end_time, nps, (float)nps / 430914.0);
}

void POS::PrintBoard() const {

    static const char piece_name[] = {'P', 'p', 'N', 'n', 'B', 'b', 'R', 'r', 'Q', 'q', 'K', 'k', '.' };

    printf("     --------------------------\n     |   ");
    for (int sq = 0; sq < 64; sq++) {
        printf("%c ", piece_name[mPc[sq ^ (BC * 56)]]);
        if ((sq + 1) % 8 == 0) printf(" %d   |\n     |   ", 9 - ((sq + 1) / 8));
    }

    printf("                     |\n     |   a b c d e f g h   (%c)|\n     --------------------------\n",
                                                                                            mSide == WC ? 'w' : 'b');
}
