#include <iostream>
#include <time.h>
#include "sorts.h"


int main(){
        int mass[10];
        random(mass, 10);
        print(mass, 10);
        Swap(mass, 10);
        print(mass, 10);

        return 0;
}
