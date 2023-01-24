#include<iostream>
#include<time.h>


void random(int *ar, int size){
        srand(time(nullptr));
        for (int i = 0; i < size; i++) {
                ar[i] = rand() % 100;
        }
}

void print(int *ar, int size){
        for(int i = 0; i < size; i++){

                std::cout << ar[i] << '\t';
        }
        std::cout << '\n';
}

void sort(int *ar, int size){
	for(int i = 0; i < size; i++){
		if(ar[i] < ar[i + 1]){
			int key = ar[i + 1];
			int index = i;
                        for(int j = i - 1; ar[j] >= key && j >= 0; j--){
				ar[j + 1] = ar[j];
				int index = index - 1;
			}
		        ar[index] = key;	
		}
	}
}




int main(){
	int ar[10];
	random(ar, 10);
	print(ar, 10);
	sort(ar,10);
	print(ar, 10);

	return 0;
}










