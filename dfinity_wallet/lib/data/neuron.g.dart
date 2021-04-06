// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'neuron.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class NeuronAdapter extends TypeAdapter<Neuron> {
  @override
  final int typeId = 3;

  @override
  Neuron read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return Neuron(
      id: fields[1] as BigInt,
      recentBallots: (fields[2] as List).cast<BallotInfo>(),
      createdTimestampSeconds: fields[3] as BigInt,
      votingPower: fields[4] as BigInt,
      state: fields[5] as NeuronState,
      dissolveDelaySeconds: fields[6] as BigInt,
      cachedNeuronStakeDoms: fields[7] as BigInt,
    )
      ..neuronFeesDoms = fields[8] as BigInt
      ..maturityDomsEquivalent = fields[9] as BigInt
      ..whenDissolvedTimestampSeconds = fields[10] as BigInt?
      ..followees = (fields[11] as List).cast<Followee>();
  }

  @override
  void write(BinaryWriter writer, Neuron obj) {
    writer
      ..writeByte(11)
      ..writeByte(1)
      ..write(obj.id)
      ..writeByte(2)
      ..write(obj.recentBallots)
      ..writeByte(3)
      ..write(obj.createdTimestampSeconds)
      ..writeByte(4)
      ..write(obj.votingPower)
      ..writeByte(5)
      ..write(obj.state)
      ..writeByte(6)
      ..write(obj.dissolveDelaySeconds)
      ..writeByte(7)
      ..write(obj.cachedNeuronStakeDoms)
      ..writeByte(8)
      ..write(obj.neuronFeesDoms)
      ..writeByte(9)
      ..write(obj.maturityDomsEquivalent)
      ..writeByte(10)
      ..write(obj.whenDissolvedTimestampSeconds)
      ..writeByte(11)
      ..write(obj.followees);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is NeuronAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
