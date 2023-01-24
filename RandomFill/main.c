#include <iostream>
#include <time.h>

void random(int *ar, int size, int min, int max){
	srand(time(nullptr));
	for (int i = 0; i < size; i++){
		int num = rand()%100;
		if (num < max && num > min){
			ar[i] = num;
		}
		else{
			i = i - 1;
		}
	}
}


void print(int *ar, int size){
	for(int i = 0; i < size; i++){
		std::cout << ar[i] << "\t";
	}
}


bool check(int *ar, int size,  int min, int max){
	int count = 0;
	for(int i = 0; i < size; i++){
		if(ar[i] >= max || ar[i] <= min){
			count = count + 1;
		}
	}
	if(count == 0){
		return true;
	}
	return false;
}


int getCountNumbers(int *ar, int size, int number){
	int count = 0;
	for(int i = 0; i < size; i++){
		if (ar[i] == number){
			count = count + 1;
		}
	}
	return count;
}

//bool checkGetCountNumber(int *ar, int size){



int main(){
	int ar[1100];
	int min = 24;
	int max = 80;
	random(ar, 1100, min, max);
	print(ar,1100);
	std::cout << check(ar, 1100, min, max) << std::endl;
	std::cout << getCountNumbers(ar, 1100, 58) << std::endl;
	
	return 0;
}
