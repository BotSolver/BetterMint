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
#include <cctype>

void PrintSingleOption(int ind) {
    printf("option name %s type spin default %d min %d max %d\n",
            paramNames[ind], Par.values[ind], Par.min_val[ind], Par.max_val[ind]);
}

void PrintUciOptions() {

    printf("option name Hash type spin default 16 min 1 max 4096\n");
#ifdef USE_THREADS
    printf("option name Threads type spin default %d min 1 max %d\n", Glob.thread_no, MAX_THREADS);
#endif
    printf("option name MultiPV type spin default %d min 1 max %d\n", Glob.multiPv, MAX_PV);
    printf("option name Clear Hash type button\n");

    printf("option name Ponder type check default %s\n", Par.use_ponder ? "true" : "false");
    printf("option name UseBook type check default %s\n", Par.use_book ? "true" : "false");
    printf("option name VerboseBook type check default %s\n", Par.verbose_book ? "true" : "false");

    printf("option name MainBookFile type string default %s\n", MainBook.bookName);

    printf("option name TimeBuffer type spin default %d min 0 max 1000\n", Glob.time_buffer);

}

static void valuebool(bool& param, char *val) {

    for (int i = 0; val[i]; i++)
        val[i] = tolower(val[i]);

    if (strcmp(val, "true")  == 0) param = true;
    if (strcmp(val, "false") == 0) param = false;
}

// @brief set a value that is a part of Par.values[]

static void setvalue(int ind, int val, bool isTable) {

    Par.values[ind] = val;
    if (isTable) Par.InitPst();
    Glob.should_clear = true;
}

static char *pseudotrimstring(char *in_str) {

    for (int last = (int)strlen(in_str)-1; last >= 0 && in_str[last] == ' '; last--)
        in_str[last] = '\0';

    while (*in_str == ' ') in_str++;

    return in_str;
}

void ParseSetoption(const char *ptr) {

    char *name, *value;

    char *npos = (char *)strstr(ptr, " name ");  // len(" name ") == 6, len(" value ") == 7
    char *vpos = (char *)strstr(ptr, " value "); // sorry for an ugly "unconst"

    if ( !npos ) return; // if no 'name'

    if ( vpos ) {
        *vpos = '\0';
        value = pseudotrimstring(vpos + 7);
    }
    else value = npos; // fake, just to prevent possible crash if misusing

    name = pseudotrimstring(npos + 6);

    for (int i = 0; name[i]; i++)   // make `name` lowercase
        name[i] = tolower(name[i]); // we can't lowercase `value` 'coz paths are case-sensitive on linux

    printf_debug("setoption name: '%s' value: '%s'\n", name, value );

    if (strcmp(name, "hash") == 0)                                           {
        Trans.AllocTrans(atoi(value));
#ifdef USE_THREADS
    } else if (strcmp(name, "threads") == 0)                                 {
        Glob.thread_no = (atoi(value));
        if (Glob.thread_no > MAX_THREADS) Glob.thread_no = MAX_THREADS;

        if (Glob.thread_no != (int)Engines.size()) {
            Engines.clear();
            for (int i = 0; i < Glob.thread_no; i++)
                Engines.emplace_back(i);
        }
#endif
    } else if (strcmp(name, "clear hash") == 0)                              {
        Trans.Clear();
    } else if (strcmp(name, "timebuffer") == 0)                              {
        Glob.time_buffer = atoi(value);
     } else if (strcmp(name, "multipv") == 0)                                {
        Glob.multiPv = atoi(value);

    // Here starts a block of non-eval options

    } else if (strcmp(name, "mainbookfile") == 0)                            {
        MainBook.SetBookName(value);
    } else if (strcmp(name, "contempt") == 0)                                {
        Par.draw_score = atoi(value);
        Glob.should_clear = true;
    } else if (strcmp(name, "evalblur") == 0)                                {
        Par.eval_blur = atoi(value);
        Glob.should_clear = true;
    } else if (strcmp(name, "npslimit") == 0)                                {
        Par.nps_limit = atoi(value);
    } else if (strcmp(name, "uci_elo") == 0)                                 {
        Par.elo = atoi(value);
        Par.SetSpeed(Par.elo);
    } else if (strcmp(name, "uci_limitstrength") == 0)                       {
        valuebool(Par.fl_weakening, value);
    } else if (strcmp(name, "ponder") == 0)                                  {
        valuebool(Par.use_ponder, value);
    } else if (strcmp(name, "usebook") == 0)                                 {
        valuebool(Par.use_book, value);
    } else if (strcmp(name, "verbosebook") == 0)                             {
        valuebool(Par.verbose_book, value);
    } else if (strcmp(name, "slowmover") == 0)                               {
        Par.time_percentage = atoi(value);
    } else if (strcmp(name, "selectivity") == 0)                             {
        Par.hist_perc = atoi(value);
        Par.hist_limit = -MAX_HIST + ((MAX_HIST * Par.hist_perc) / 100);
        Glob.should_clear = true;
    }
}